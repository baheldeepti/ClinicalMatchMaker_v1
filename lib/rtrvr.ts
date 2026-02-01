import { getRtrvrApiKey } from './config';
import type { EligibilityCriteria, CriteriaCategory } from './schemas';

// ============================================================================
// Types
// ============================================================================

export interface RtrvrClient {
  apiKey: string;
  baseUrl: string;
}

export interface TrialExtraction {
  inclusionCriteria: Array<{ criterion: string; category: CriteriaCategory }>;
  exclusionCriteria: Array<{ criterion: string; category: CriteriaCategory }>;
  ageRange: { min: number; max: number };
  acceptsHealthyVolunteers: boolean;
  rawText: string;
}

interface RtrvrResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// Cache
// ============================================================================

const extractionCache = new Map<string, TrialExtraction>();

// ============================================================================
// Client Creation
// ============================================================================

/**
 * Create an rtrvr.ai client for web extraction
 */
export function createRtrvrClient(apiKey?: string): RtrvrClient {
  const key = apiKey || getRtrvrApiKey();

  return {
    apiKey: key,
    baseUrl: 'https://api.rtrvr.ai',
  };
}

// ============================================================================
// Extraction Schema for rtrvr.ai
// ============================================================================

const ELIGIBILITY_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    inclusion_criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          category: {
            type: 'string',
            enum: ['diagnosis', 'biomarker', 'treatment', 'demographics', 'other'],
          },
        },
      },
      description: 'List of inclusion criteria with categorization',
    },
    exclusion_criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          category: {
            type: 'string',
            enum: ['diagnosis', 'biomarker', 'treatment', 'demographics', 'other'],
          },
        },
      },
      description: 'List of exclusion criteria with categorization',
    },
    minimum_age: {
      type: 'number',
      description: 'Minimum age in years',
    },
    maximum_age: {
      type: 'number',
      description: 'Maximum age in years (use 120 if no upper limit)',
    },
    accepts_healthy_volunteers: {
      type: 'boolean',
      description: 'Whether the trial accepts healthy volunteers',
    },
    raw_eligibility_text: {
      type: 'string',
      description: 'The complete raw eligibility text',
    },
  },
  required: ['inclusion_criteria', 'exclusion_criteria'],
};

// ============================================================================
// URL Construction
// ============================================================================

/**
 * Construct ClinicalTrials.gov URL from NCT ID
 */
export function buildTrialUrl(nctId: string): string {
  return `https://clinicaltrials.gov/study/${nctId}`;
}

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Extract trial eligibility data using rtrvr.ai
 */
export async function extractTrialData(
  client: RtrvrClient,
  nctId: string
): Promise<TrialExtraction> {
  // Check cache first
  const cached = extractionCache.get(nctId);
  if (cached) {
    return cached;
  }

  const url = buildTrialUrl(nctId);

  try {
    const response = await fetch(`${client.baseUrl}/v1/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${client.apiKey}`,
      },
      body: JSON.stringify({
        url,
        schema: ELIGIBILITY_EXTRACTION_SCHEMA,
        instructions:
          'Extract the eligibility criteria from this clinical trial page. ' +
          'Focus on the Eligibility section. Parse each criterion separately and categorize it. ' +
          'Categories: diagnosis (cancer type, histology, stage), biomarker (genetic markers, protein expression), ' +
          'treatment (prior therapy, washout periods), demographics (age, gender), other (performance status, organ function).',
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 404) {
        throw new Error(`Trial ${nctId} not found.`);
      }
      throw new Error(`Extraction failed: ${response.statusText}`);
    }

    const result: RtrvrResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Extraction returned no data');
    }

    const extraction = transformRtrvrResponse(result.data, nctId);

    // Cache the result
    extractionCache.set(nctId, extraction);

    return extraction;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw new Error(`Extraction timed out for trial ${nctId}`);
      }
      throw error;
    }
    throw new Error(`Unknown error extracting trial ${nctId}`);
  }
}

// ============================================================================
// Response Transformation
// ============================================================================

function transformRtrvrResponse(
  data: Record<string, unknown>,
  _nctId: string
): TrialExtraction {
  const inclusionRaw = (data.inclusion_criteria as Array<{ text: string; category: string }>) || [];
  const exclusionRaw = (data.exclusion_criteria as Array<{ text: string; category: string }>) || [];

  return {
    inclusionCriteria: inclusionRaw.map((item) => ({
      criterion: item.text || '',
      category: validateCategory(item.category),
    })),
    exclusionCriteria: exclusionRaw.map((item) => ({
      criterion: item.text || '',
      category: validateCategory(item.category),
    })),
    ageRange: {
      min: typeof data.minimum_age === 'number' ? data.minimum_age : 0,
      max: typeof data.maximum_age === 'number' ? data.maximum_age : 120,
    },
    acceptsHealthyVolunteers: data.accepts_healthy_volunteers === true,
    rawText: typeof data.raw_eligibility_text === 'string' ? data.raw_eligibility_text : '',
  };
}

function validateCategory(category: string): CriteriaCategory {
  const validCategories: CriteriaCategory[] = [
    'diagnosis',
    'biomarker',
    'treatment',
    'demographics',
    'other',
  ];

  if (validCategories.includes(category as CriteriaCategory)) {
    return category as CriteriaCategory;
  }

  return 'other';
}

// ============================================================================
// Batch Extraction
// ============================================================================

/**
 * Extract data for multiple trials in parallel
 */
export async function extractMultipleTrials(
  client: RtrvrClient,
  nctIds: string[],
  concurrency: number = 3
): Promise<Map<string, TrialExtraction | Error>> {
  const results = new Map<string, TrialExtraction | Error>();
  const queue = [...nctIds];

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const nctId = queue.shift();
      if (!nctId) break;

      try {
        const extraction = await extractTrialData(client, nctId);
        results.set(nctId, extraction);
      } catch (error) {
        results.set(
          nctId,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  // Run concurrent workers
  const workers = Array(Math.min(concurrency, nctIds.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);

  return results;
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear the extraction cache
 */
export function clearExtractionCache(): void {
  extractionCache.clear();
}

/**
 * Get cache size
 */
export function getExtractionCacheSize(): number {
  return extractionCache.size;
}

// ============================================================================
// Eligibility Transformation to Schema
// ============================================================================

/**
 * Convert extraction to EligibilityCriteria schema format
 */
export function toEligibilityCriteria(
  extraction: TrialExtraction,
  nctId: string
): EligibilityCriteria {
  return {
    nctId,
    inclusionCriteria: extraction.inclusionCriteria,
    exclusionCriteria: extraction.exclusionCriteria,
    ageRange: extraction.ageRange,
    acceptsHealthyVolunteers: extraction.acceptsHealthyVolunteers,
    rawText: extraction.rawText,
  };
}
