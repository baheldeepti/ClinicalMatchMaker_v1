import { getClinicalTrialsApiBase } from '../../lib/config';
import { filterByRadius, addDistanceToLocations } from '../../lib/geo-utils';
import type {
  ScoutInput,
  TrialDiscoveryOutput,
  Trial,
  Location,
} from '../../lib/schemas';

// ============================================================================
// Types
// ============================================================================

interface CTGovStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
    };
    statusModule: {
      overallStatus: string;
    };
    designModule?: {
      phases?: string[];
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: {
        name: string;
      };
    };
    conditionsModule?: {
      conditions?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        name: string;
        type: string;
      }>;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      }>;
    };
  };
}

interface CTGovResponse {
  studies: CTGovStudy[];
  totalCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_TRIALS_TO_RETURN = 5;
const PAGE_SIZE = 20;

// Use mock data in development to avoid CORS issues
const USE_MOCK_DATA = true;

// ============================================================================
// Mock Data for Development
// ============================================================================

function getMockTrials(condition: string): CTGovResponse {
  const mockStudies: CTGovStudy[] = [
    {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT04613596',
          briefTitle: `Phase 3 Study of Pembrolizumab Plus Chemotherapy for ${condition}`,
        },
        statusModule: { overallStatus: 'RECRUITING' },
        designModule: { phases: ['PHASE3'] },
        sponsorCollaboratorsModule: { leadSponsor: { name: 'Merck Sharp & Dohme LLC' } },
        conditionsModule: { conditions: [condition, 'Carcinoma, Non-Small-Cell Lung'] },
        armsInterventionsModule: {
          interventions: [
            { name: 'Pembrolizumab', type: 'DRUG' },
            { name: 'Chemotherapy', type: 'DRUG' },
          ],
        },
        contactsLocationsModule: {
          locations: [
            { facility: 'Memorial Sloan Kettering Cancer Center', city: 'New York', state: 'New York', zip: '10065', country: 'United States' },
            { facility: 'NYU Langone Health', city: 'New York', state: 'New York', zip: '10016', country: 'United States' },
          ],
        },
      },
    },
    {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT05502913',
          briefTitle: `Targeted Therapy Study for Advanced ${condition}`,
        },
        statusModule: { overallStatus: 'RECRUITING' },
        designModule: { phases: ['PHASE2'] },
        sponsorCollaboratorsModule: { leadSponsor: { name: 'AstraZeneca' } },
        conditionsModule: { conditions: [condition] },
        armsInterventionsModule: {
          interventions: [{ name: 'Osimertinib', type: 'DRUG' }],
        },
        contactsLocationsModule: {
          locations: [
            { facility: 'Massachusetts General Hospital', city: 'Boston', state: 'Massachusetts', zip: '02114', country: 'United States' },
          ],
        },
      },
    },
    {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT04487587',
          briefTitle: `Immunotherapy Combination Trial for ${condition}`,
        },
        statusModule: { overallStatus: 'RECRUITING' },
        designModule: { phases: ['PHASE2'] },
        sponsorCollaboratorsModule: { leadSponsor: { name: 'Bristol-Myers Squibb' } },
        conditionsModule: { conditions: [condition, 'Lung Neoplasms'] },
        armsInterventionsModule: {
          interventions: [
            { name: 'Nivolumab', type: 'DRUG' },
            { name: 'Ipilimumab', type: 'DRUG' },
          ],
        },
        contactsLocationsModule: {
          locations: [
            { facility: 'MD Anderson Cancer Center', city: 'Houston', state: 'Texas', zip: '77030', country: 'United States' },
          ],
        },
      },
    },
    {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT05789108',
          briefTitle: `Novel CAR-T Cell Therapy for ${condition}`,
        },
        statusModule: { overallStatus: 'RECRUITING' },
        designModule: { phases: ['PHASE1'] },
        sponsorCollaboratorsModule: { leadSponsor: { name: 'National Cancer Institute' } },
        conditionsModule: { conditions: [condition] },
        armsInterventionsModule: {
          interventions: [{ name: 'CAR-T Cell Therapy', type: 'BIOLOGICAL' }],
        },
        contactsLocationsModule: {
          locations: [
            { facility: 'NIH Clinical Center', city: 'Bethesda', state: 'Maryland', zip: '20892', country: 'United States' },
          ],
        },
      },
    },
    {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT04721444',
          briefTitle: `Biomarker-Driven Study for ${condition} with EGFR Mutation`,
        },
        statusModule: { overallStatus: 'RECRUITING' },
        designModule: { phases: ['PHASE3'] },
        sponsorCollaboratorsModule: { leadSponsor: { name: 'Roche' } },
        conditionsModule: { conditions: [condition, 'EGFR Positive'] },
        armsInterventionsModule: {
          interventions: [{ name: 'Erlotinib', type: 'DRUG' }],
        },
        contactsLocationsModule: {
          locations: [
            { facility: 'UCSF Medical Center', city: 'San Francisco', state: 'California', zip: '94143', country: 'United States' },
            { facility: 'Stanford Cancer Institute', city: 'Stanford', state: 'California', zip: '94305', country: 'United States' },
          ],
        },
      },
    },
  ];

  return {
    studies: mockStudies,
    totalCount: mockStudies.length,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Query ClinicalTrials.gov API v2.0
 */
async function queryClinicalTrials(
  condition: string,
  zipcode: string,
  radiusMiles: number,
  phases?: string[]
): Promise<CTGovResponse> {
  // Use mock data to avoid CORS issues in browser
  if (USE_MOCK_DATA) {
    console.log('Using mock trial data for development');
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockTrials(condition);
  }

  const baseUrl = getClinicalTrialsApiBase();
  const url = new URL(`${baseUrl}/studies`);

  // Build query parameters
  url.searchParams.set('query.cond', condition);
  url.searchParams.set('filter.overallStatus', 'RECRUITING');
  url.searchParams.set('filter.studyType', 'INTERVENTIONAL');
  url.searchParams.set('pageSize', String(PAGE_SIZE));

  // Add geographic filter if available
  if (zipcode) {
    url.searchParams.set('filter.geo', `distance(${zipcode},${radiusMiles}mi)`);
  }

  // Add phase filter if specified
  if (phases && phases.length > 0) {
    url.searchParams.set('filter.phase', phases.join(','));
  }

  // Request specific fields
  url.searchParams.set(
    'fields',
    [
      'NCTId',
      'BriefTitle',
      'Phase',
      'OverallStatus',
      'LeadSponsorName',
      'Condition',
      'InterventionName',
      'LocationFacility',
      'LocationCity',
      'LocationState',
      'LocationZip',
      'LocationCountry',
    ].join(',')
  );

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`ClinicalTrials.gov API error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Map phase from API response to our schema
 */
function mapPhase(phases?: string[]): Trial['phase'] {
  if (!phases || phases.length === 0) return 'N/A';

  const phase = phases[0].toUpperCase();
  if (phase.includes('1')) return 'Phase 1';
  if (phase.includes('2')) return 'Phase 2';
  if (phase.includes('3')) return 'Phase 3';
  if (phase.includes('4')) return 'Phase 4';
  return 'N/A';
}

/**
 * Transform API study to our Trial schema
 */
function transformStudyToTrial(study: CTGovStudy): Trial {
  const { protocolSection } = study;
  const { identificationModule, statusModule } = protocolSection;

  const nctId = identificationModule.nctId;

  // Extract locations (US only)
  const rawLocations = protocolSection.contactsLocationsModule?.locations || [];
  const locations: Location[] = rawLocations
    .filter((loc) => loc.country === 'United States')
    .map((loc) => ({
      facility: loc.facility || 'Unknown Facility',
      city: loc.city || '',
      state: loc.state || '',
      zipcode: loc.zip || '',
    }));

  // Extract interventions
  const interventions =
    protocolSection.armsInterventionsModule?.interventions?.map((i) => i.name) || [];

  return {
    nctId,
    title: identificationModule.briefTitle,
    phase: mapPhase(protocolSection.designModule?.phases),
    status: statusModule.overallStatus,
    sponsor: protocolSection.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown',
    conditions: protocolSection.conditionsModule?.conditions || [],
    interventions,
    locations,
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

// ============================================================================
// Main Agent Function
// ============================================================================

/**
 * Run the Clinical Trial Scout agent
 * Discovers actively recruiting trials matching patient condition and location
 */
export async function runScoutAgent(input: ScoutInput): Promise<TrialDiscoveryOutput> {
  const { diagnosis, zipcode, travelRadiusMiles, phase } = input;

  try {
    // Query ClinicalTrials.gov API
    const response = await queryClinicalTrials(
      diagnosis,
      zipcode,
      travelRadiusMiles,
      phase
    );

    if (!response.studies || response.studies.length === 0) {
      return {
        trials: [],
        totalFound: 0,
        searchParams: {
          diagnosis,
          zipcode,
          travelRadiusMiles,
          phase,
        },
      };
    }

    // Transform studies to trials
    let trials = response.studies.map(transformStudyToTrial);

    // Filter by location radius and add distances
    trials = trials.map((trial) => ({
      ...trial,
      locations: trial.locations.length > 0
        ? filterByRadius(trial.locations, zipcode, travelRadiusMiles)
        : addDistanceToLocations(trial.locations, zipcode),
    }));

    // Remove trials with no locations within radius
    trials = trials.filter((trial) => trial.locations.length > 0);

    // Sort by closest location distance
    trials.sort((a, b) => {
      const distA = a.locations[0]?.distance ?? Infinity;
      const distB = b.locations[0]?.distance ?? Infinity;
      return distA - distB;
    });

    // Limit to top N trials
    const topTrials = trials.slice(0, MAX_TRIALS_TO_RETURN);

    return {
      trials: topTrials,
      totalFound: response.totalCount,
      searchParams: {
        diagnosis,
        zipcode,
        travelRadiusMiles,
        phase,
      },
    };
  } catch (error) {
    console.error('Scout agent error:', error);

    // Return empty results on error
    return {
      trials: [],
      totalFound: 0,
      searchParams: {
        diagnosis,
        zipcode,
        travelRadiusMiles,
        phase,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// ============================================================================
// Retry Wrapper
// ============================================================================

/**
 * Run scout agent with retry logic
 */
export async function runScoutAgentWithRetry(
  input: ScoutInput,
  maxRetries: number = 2
): Promise<TrialDiscoveryOutput> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await runScoutAgent(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  // Return empty results after all retries failed
  return {
    trials: [],
    totalFound: 0,
    searchParams: {
      ...input,
      error: lastError?.message || 'Failed after retries',
    },
  };
}
