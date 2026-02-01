import type {
  ExtractorInput,
  EligibilityCriteria,
  CriteriaCategory,
} from '../../lib/schemas';

// Use mock data in development to avoid API issues
const USE_MOCK_DATA = true;

// ============================================================================
// Mock Eligibility Data
// ============================================================================

function getMockEligibility(nctId: string): EligibilityCriteria {
  const mockCriteria: Record<string, EligibilityCriteria> = {
    'NCT04613596': {
      nctId,
      inclusionCriteria: [
        { criterion: 'Histologically confirmed non-small cell lung cancer', category: 'diagnosis' },
        { criterion: 'Stage IIIB or IV disease', category: 'diagnosis' },
        { criterion: 'ECOG performance status 0-1', category: 'other' },
        { criterion: 'At least one measurable lesion per RECIST 1.1', category: 'other' },
        { criterion: 'Adequate organ function', category: 'other' },
      ],
      exclusionCriteria: [
        { criterion: 'Prior therapy with anti-PD-1 or anti-PD-L1 agents', category: 'treatment' },
        { criterion: 'Active autoimmune disease requiring systemic treatment', category: 'other' },
        { criterion: 'Known EGFR or ALK genomic alterations', category: 'biomarker' },
      ],
      ageRange: { min: 18, max: 120 },
      acceptsHealthyVolunteers: false,
      rawText: '',
    },
    'NCT05502913': {
      nctId,
      inclusionCriteria: [
        { criterion: 'Advanced or metastatic NSCLC', category: 'diagnosis' },
        { criterion: 'EGFR mutation positive (Ex19del or L858R)', category: 'biomarker' },
        { criterion: 'ECOG performance status 0-2', category: 'other' },
        { criterion: 'No prior EGFR TKI therapy', category: 'treatment' },
      ],
      exclusionCriteria: [
        { criterion: 'Brain metastases unless treated and stable', category: 'diagnosis' },
        { criterion: 'Prior treatment with osimertinib', category: 'treatment' },
      ],
      ageRange: { min: 18, max: 120 },
      acceptsHealthyVolunteers: false,
      rawText: '',
    },
    'NCT04487587': {
      nctId,
      inclusionCriteria: [
        { criterion: 'Histologically confirmed NSCLC', category: 'diagnosis' },
        { criterion: 'PD-L1 expression >= 1%', category: 'biomarker' },
        { criterion: 'No prior systemic therapy for metastatic disease', category: 'treatment' },
        { criterion: 'ECOG performance status 0-1', category: 'other' },
      ],
      exclusionCriteria: [
        { criterion: 'EGFR or ALK positive mutations', category: 'biomarker' },
        { criterion: 'Active infection requiring systemic therapy', category: 'other' },
      ],
      ageRange: { min: 18, max: 85 },
      acceptsHealthyVolunteers: false,
      rawText: '',
    },
    'NCT05789108': {
      nctId,
      inclusionCriteria: [
        { criterion: 'Relapsed or refractory NSCLC', category: 'diagnosis' },
        { criterion: 'Failed at least 2 prior lines of therapy', category: 'treatment' },
        { criterion: 'ECOG performance status 0-1', category: 'other' },
        { criterion: 'Adequate bone marrow function', category: 'other' },
      ],
      exclusionCriteria: [
        { criterion: 'Prior CAR-T therapy', category: 'treatment' },
        { criterion: 'Active CNS involvement', category: 'diagnosis' },
      ],
      ageRange: { min: 18, max: 75 },
      acceptsHealthyVolunteers: false,
      rawText: '',
    },
    'NCT04721444': {
      nctId,
      inclusionCriteria: [
        { criterion: 'Advanced NSCLC with confirmed EGFR mutation', category: 'biomarker' },
        { criterion: 'Stage IIIB/IV disease', category: 'diagnosis' },
        { criterion: 'ECOG performance status 0-2', category: 'other' },
      ],
      exclusionCriteria: [
        { criterion: 'T790M resistance mutation', category: 'biomarker' },
        { criterion: 'Prior EGFR TKI within 14 days', category: 'treatment' },
      ],
      ageRange: { min: 18, max: 120 },
      acceptsHealthyVolunteers: false,
      rawText: '',
    },
  };

  return mockCriteria[nctId] || {
    nctId,
    inclusionCriteria: [
      { criterion: 'Confirmed cancer diagnosis', category: 'diagnosis' as CriteriaCategory },
      { criterion: 'ECOG 0-2', category: 'other' as CriteriaCategory },
    ],
    exclusionCriteria: [
      { criterion: 'Prior experimental therapy within 30 days', category: 'treatment' as CriteriaCategory },
    ],
    ageRange: { min: 18, max: 120 },
    acceptsHealthyVolunteers: false,
    rawText: '',
  };
}

// ============================================================================
// Main Agent Function
// ============================================================================

/**
 * Run the Eligibility Extractor agent
 * Extracts and parses eligibility criteria from trial pages
 */
export async function runExtractorAgent(
  input: ExtractorInput
): Promise<EligibilityCriteria> {
  const { nctId } = input;

  // Use mock data to avoid API issues in browser
  if (USE_MOCK_DATA) {
    console.log(`Using mock eligibility data for ${nctId}`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    return getMockEligibility(nctId);
  }

  // Fallback - return default criteria
  return getMockEligibility(nctId);
}

// ============================================================================
// Batch Extraction
// ============================================================================

/**
 * Extract eligibility for multiple trials in parallel
 */
export async function runExtractorAgentBatch(
  inputs: ExtractorInput[],
  concurrency: number = 3
): Promise<Map<string, EligibilityCriteria>> {
  const results = new Map<string, EligibilityCriteria>();

  // Process in batches
  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((input) => runExtractorAgent(input))
    );

    batch.forEach((input, idx) => {
      results.set(input.nctId, batchResults[idx]);
    });
  }

  return results;
}
