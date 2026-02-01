import { createToolhouseClient, runAgent } from '../../lib/toolhouse';
import type {
  MatcherInput,
  MatchResult,
  MatchCategory,
  MatchingFactor,
  BlockingFactor,
  PatientProfile,
  EligibilityCriteria,
} from '../../lib/schemas';

// ============================================================================
// Types
// ============================================================================

interface LLMMatchResponse {
  score: number;
  category: MatchCategory;
  matchingFactors: MatchingFactor[];
  blockingFactors: BlockingFactor[];
  uncertainFactors: string[];
  summary: string;
}

// ============================================================================
// Weight Configuration
// ============================================================================

const CRITERIA_WEIGHTS: Record<string, number> = {
  diagnosis: 10,
  biomarker: 9,
  stage: 8,
  ecog: 7,
  treatment: 6,
  demographics: 5,
  other: 3,
};

// ============================================================================
// Matching Logic
// ============================================================================

/**
 * Check ECOG score against criteria
 */
function checkECOG(
  patientECOG: number,
  criteria: EligibilityCriteria
): { match: boolean; reason?: string } {
  // Look for ECOG requirements in criteria
  const ecogCriteria = [
    ...criteria.inclusionCriteria,
    ...criteria.exclusionCriteria,
  ].find((c) => /ecog|performance status/i.test(c.criterion));

  if (!ecogCriteria) {
    return { match: true }; // No ECOG requirement found
  }

  // Try to extract ECOG requirement
  const ecogMatch = ecogCriteria.criterion.match(/ecog\s*(?:ps|score)?\s*(?:of\s*)?(\d)(?:\s*-\s*(\d))?/i);

  if (ecogMatch) {
    const minECOG = parseInt(ecogMatch[1], 10);
    const maxECOG = ecogMatch[2] ? parseInt(ecogMatch[2], 10) : minECOG;

    if (patientECOG >= minECOG && patientECOG <= maxECOG) {
      return { match: true };
    }

    return {
      match: false,
      reason: `ECOG score ${patientECOG} outside required range (${minECOG}-${maxECOG})`,
    };
  }

  return { match: true }; // Couldn't parse requirement, assume match
}

/**
 * Check biomarker alignment
 */
function checkBiomarkers(
  patientBiomarkers: string[],
  criteria: EligibilityCriteria
): { matches: string[]; conflicts: string[]; uncertain: string[] } {
  const matches: string[] = [];
  const conflicts: string[] = [];
  const uncertain: string[] = [];

  const biomarkerCriteria = criteria.inclusionCriteria.filter(
    (c) => c.category === 'biomarker'
  );
  const excludedBiomarkers = criteria.exclusionCriteria.filter(
    (c) => c.category === 'biomarker'
  );

  // Normalize biomarkers for comparison
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedPatient = patientBiomarkers.map(normalize);

  // Check inclusion criteria
  for (const criterion of biomarkerCriteria) {
    const criterionNorm = normalize(criterion.criterion);

    const hasMatch = normalizedPatient.some(
      (pb) => criterionNorm.includes(pb) || pb.includes(criterionNorm)
    );

    if (hasMatch) {
      matches.push(criterion.criterion);
    } else {
      uncertain.push(criterion.criterion);
    }
  }

  // Check exclusion criteria
  for (const criterion of excludedBiomarkers) {
    const criterionNorm = normalize(criterion.criterion);

    const hasConflict = normalizedPatient.some(
      (pb) => criterionNorm.includes(pb) || pb.includes(criterionNorm)
    );

    if (hasConflict) {
      conflicts.push(criterion.criterion);
    }
  }

  return { matches, conflicts, uncertain };
}

/**
 * Check treatment history alignment
 */
function checkTreatmentHistory(
  previousTreatments: string[],
  criteria: EligibilityCriteria
): { matches: string[]; conflicts: string[] } {
  const matches: string[] = [];
  const conflicts: string[] = [];

  const treatmentInclusion = criteria.inclusionCriteria.filter(
    (c) => c.category === 'treatment'
  );
  const treatmentExclusion = criteria.exclusionCriteria.filter(
    (c) => c.category === 'treatment'
  );

  const normalizedTreatments = previousTreatments.map((t) =>
    t.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  // Check if prior treatment is required
  for (const criterion of treatmentInclusion) {
    if (/prior|previous|must have received/i.test(criterion.criterion)) {
      const required = criterion.criterion.toLowerCase();
      const hasRequired = normalizedTreatments.some((t) => required.includes(t));

      if (hasRequired) {
        matches.push(`Prior ${criterion.criterion.slice(0, 50)}...`);
      }
    }
  }

  // Check for excluded treatments
  for (const criterion of treatmentExclusion) {
    const excluded = criterion.criterion.toLowerCase();
    const hasExcluded = normalizedTreatments.some((t) => excluded.includes(t));

    if (hasExcluded) {
      conflicts.push(`Excluded: ${criterion.criterion.slice(0, 50)}...`);
    }
  }

  return { matches, conflicts };
}

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate match score and category
 */
function calculateScore(
  matchingFactors: MatchingFactor[],
  blockingFactors: BlockingFactor[],
  uncertainFactors: string[]
): { score: number; category: MatchCategory } {
  // If there are hard exclusions, score is very low
  if (blockingFactors.length > 0) {
    const score = Math.max(0, 20 - blockingFactors.length * 10);
    return { score, category: 'not_eligible' };
  }

  // Calculate weighted score from matching factors
  const totalWeight = matchingFactors.reduce((sum, f) => sum + f.weight, 0);
  const maxPossibleWeight = Object.values(CRITERIA_WEIGHTS).reduce((a, b) => a + b, 0);

  // Penalize for uncertain factors
  const uncertaintyPenalty = uncertainFactors.length * 5;

  let score = Math.round((totalWeight / maxPossibleWeight) * 100) - uncertaintyPenalty;
  score = Math.max(0, Math.min(100, score));

  // Determine category
  let category: MatchCategory;
  if (score >= 75) {
    category = 'strong_match';
  } else if (score >= 50) {
    category = 'possible_match';
  } else if (score >= 25) {
    category = 'future_potential';
  } else {
    category = 'not_eligible';
  }

  return { score, category };
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate plain-language summary
 */
function generateSummary(
  category: MatchCategory,
  matchingFactors: MatchingFactor[],
  blockingFactors: BlockingFactor[]
): string {
  if (category === 'not_eligible' && blockingFactors.length > 0) {
    const mainReason = blockingFactors[0].reason;
    return `This trial may not be a good fit right now. ${mainReason}. Consider discussing alternative options with your doctor.`;
  }

  if (category === 'strong_match') {
    const topFactor = matchingFactors[0]?.factor || 'your profile';
    return `This trial looks like a strong match for you. ${topFactor} aligns well with what the trial is looking for. Talk to your doctor about whether this could be a good option.`;
  }

  if (category === 'possible_match') {
    return `This trial could potentially be a fit for you. Some of your information matches what they're looking for, but a few details would need to be confirmed. Your doctor can help determine if you qualify.`;
  }

  // future_potential
  return `This trial might become an option in the future. Right now, there are some differences between your situation and what the trial requires. Your doctor can explain more about what might need to change.`;
}

// ============================================================================
// Main Agent Function
// ============================================================================

// Skip LLM calls in development
const USE_RULES_ONLY = true;

/**
 * Run the Clinical Matcher agent
 * Compares patient profile against eligibility criteria
 */
export async function runMatcherAgent(input: MatcherInput): Promise<MatchResult> {
  const { patientProfile, eligibilityCriteria, nctId } = input;

  console.log(`Matching patient against trial ${nctId}`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!USE_RULES_ONLY) {
    try {
      // Try LLM-based matching first for better accuracy
      const llmResult = await matchWithLLM(patientProfile, eligibilityCriteria, nctId);

      if (llmResult) {
        return llmResult;
      }
    } catch (error) {
      console.warn('LLM matching failed, using rule-based fallback:', error);
    }
  }

  // Use rule-based matching
  return matchWithRules(patientProfile, eligibilityCriteria, nctId);
}

/**
 * LLM-based matching using Toolhouse
 */
async function matchWithLLM(
  profile: PatientProfile,
  criteria: EligibilityCriteria,
  nctId: string
): Promise<MatchResult | null> {
  const client = createToolhouseClient();

  const result = await runAgent<LLMMatchResponse>(client, 'clinical-matcher', {
    patientProfile: profile,
    eligibilityCriteria: criteria,
    nctId,
  });

  if (result.success && result.output) {
    return {
      nctId,
      ...result.output,
    };
  }

  return null;
}

/**
 * Rule-based matching as fallback
 */
function matchWithRules(
  profile: PatientProfile,
  criteria: EligibilityCriteria,
  nctId: string
): MatchResult {
  const matchingFactors: MatchingFactor[] = [];
  const blockingFactors: BlockingFactor[] = [];
  const uncertainFactors: string[] = [];

  // Check ECOG
  const ecogResult = checkECOG(profile.ecogScore, criteria);
  if (ecogResult.match) {
    matchingFactors.push({
      factor: `ECOG score ${profile.ecogScore} meets requirements`,
      weight: CRITERIA_WEIGHTS.ecog,
    });
  } else if (ecogResult.reason) {
    blockingFactors.push({
      factor: 'ECOG Score',
      reason: ecogResult.reason,
    });
  }

  // Check biomarkers
  const biomarkerResult = checkBiomarkers(profile.biomarkers, criteria);
  biomarkerResult.matches.forEach((match) => {
    matchingFactors.push({
      factor: `Biomarker match: ${match.slice(0, 40)}`,
      weight: CRITERIA_WEIGHTS.biomarker,
    });
  });
  biomarkerResult.conflicts.forEach((conflict) => {
    blockingFactors.push({
      factor: 'Biomarker',
      reason: conflict,
    });
  });
  uncertainFactors.push(...biomarkerResult.uncertain.map((u) => u.slice(0, 50)));

  // Check treatment history
  const treatmentResult = checkTreatmentHistory(
    profile.previousTreatments,
    criteria
  );
  treatmentResult.matches.forEach((match) => {
    matchingFactors.push({
      factor: match,
      weight: CRITERIA_WEIGHTS.treatment,
    });
  });
  treatmentResult.conflicts.forEach((conflict) => {
    blockingFactors.push({
      factor: 'Treatment History',
      reason: conflict,
    });
  });

  // Check diagnosis match (basic)
  const diagnosisCriteria = criteria.inclusionCriteria.filter(
    (c) => c.category === 'diagnosis'
  );
  if (diagnosisCriteria.length > 0) {
    const diagnosisLower = profile.diagnosis.toLowerCase();
    const hasMatch = diagnosisCriteria.some((c) =>
      c.criterion.toLowerCase().includes(diagnosisLower) ||
      diagnosisLower.includes(c.criterion.toLowerCase().split(' ')[0])
    );

    if (hasMatch) {
      matchingFactors.push({
        factor: `Diagnosis matches trial requirements`,
        weight: CRITERIA_WEIGHTS.diagnosis,
      });
    } else {
      uncertainFactors.push('Diagnosis alignment needs confirmation');
    }
  }

  // Calculate score
  const { score, category } = calculateScore(
    matchingFactors,
    blockingFactors,
    uncertainFactors
  );

  // Generate summary
  const summary = generateSummary(category, matchingFactors, blockingFactors);

  return {
    nctId,
    score,
    category,
    matchingFactors,
    blockingFactors,
    uncertainFactors,
    summary,
  };
}

// ============================================================================
// Batch Matching
// ============================================================================

/**
 * Match patient against multiple trials
 */
export async function runMatcherAgentBatch(
  profile: PatientProfile,
  criteriaList: Array<{ nctId: string; criteria: EligibilityCriteria }>,
  concurrency: number = 5
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  // Process in parallel with limited concurrency
  const batches: Array<typeof criteriaList> = [];
  for (let i = 0; i < criteriaList.length; i += concurrency) {
    batches.push(criteriaList.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(({ nctId, criteria }) =>
        runMatcherAgent({
          patientProfile: profile,
          eligibilityCriteria: criteria,
          nctId,
        })
      )
    );
    results.push(...batchResults);
  }

  return results;
}
