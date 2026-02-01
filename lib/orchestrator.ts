import { runScoutAgent } from '../agents/scout';
import { runExtractorAgent } from '../agents/extractor';
import { runMatcherAgent } from '../agents/matcher';
import { runAdvocateAgent } from '../agents/advocate';
import type {
  PatientProfile,
  PipelineResult,
  PipelineStep,
  MatchResult,
  VoiceScript,
  EligibilityCriteria,
} from './schemas';

// ============================================================================
// Types
// ============================================================================

export type ProgressCallback = (step: PipelineStep, logs?: string[]) => void;

export interface PipelineOptions {
  maxTrials?: number;
  concurrency?: number;
  abortSignal?: AbortSignal;
}

// ============================================================================
// Pipeline Steps Configuration
// ============================================================================

const PIPELINE_STEPS: Omit<PipelineStep, 'status'>[] = [
  { id: 'scout', name: 'Finding Trials' },
  { id: 'extractor', name: 'Analyzing Eligibility' },
  { id: 'matcher', name: 'Matching Your Profile' },
  { id: 'advocate', name: 'Creating Summary' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function createStep(
  id: PipelineStep['id'],
  status: PipelineStep['status'],
  progress?: number,
  error?: string
): PipelineStep {
  const stepConfig = PIPELINE_STEPS.find((s) => s.id === id)!;
  return {
    ...stepConfig,
    status,
    progress,
    error,
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Run the complete clinical trial matching pipeline
 */
export async function runPipeline(
  patientProfile: PatientProfile,
  onProgress: ProgressCallback,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const { maxTrials = 5, concurrency = 3, abortSignal } = options;
  const startTime = Date.now();
  const completedSteps: PipelineStep[] = [];
  const logs: string[] = [];

  const addLog = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
  };

  const checkAbort = () => {
    if (abortSignal?.aborted) {
      throw new Error('Pipeline cancelled by user');
    }
  };

  try {
    // ========================================================================
    // Step 1: Scout - Discover Trials
    // ========================================================================
    addLog('Starting trial discovery...');
    onProgress(createStep('scout', 'running'), logs);

    checkAbort();

    const scoutResult = await withRetry(() =>
      runScoutAgent({
        diagnosis: patientProfile.diagnosis,
        zipcode: patientProfile.zipcode,
        travelRadiusMiles: patientProfile.travelRadiusMiles,
      })
    );

    if (scoutResult.trials.length === 0) {
      addLog('No matching trials found');
      completedSteps.push(createStep('scout', 'complete'));

      // Return early with empty results
      return {
        trials: [],
        matchResults: [],
        voiceScript: undefined,
        completedSteps: [
          createStep('scout', 'complete'),
          createStep('extractor', 'complete'),
          createStep('matcher', 'complete'),
          createStep('advocate', 'complete'),
        ],
        duration: Date.now() - startTime,
      };
    }

    const trials = scoutResult.trials.slice(0, maxTrials);
    addLog(`Found ${scoutResult.totalFound} trials, processing top ${trials.length}`);
    completedSteps.push(createStep('scout', 'complete'));
    onProgress(createStep('scout', 'complete'), logs);

    // ========================================================================
    // Step 2: Extractor - Extract Eligibility Criteria
    // ========================================================================
    addLog('Extracting eligibility criteria...');
    onProgress(createStep('extractor', 'running', 0), logs);

    checkAbort();

    const eligibilityMap = new Map<string, EligibilityCriteria>();
    const extractionErrors: string[] = [];

    // Process in batches for concurrency control
    for (let i = 0; i < trials.length; i += concurrency) {
      checkAbort();

      const batch = trials.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((trial) =>
          withRetry(() => runExtractorAgent({ nctId: trial.nctId }))
        )
      );

      batchResults.forEach((result, idx) => {
        const trial = batch[idx];
        if (result.status === 'fulfilled') {
          eligibilityMap.set(trial.nctId, result.value);
          addLog(`Extracted criteria for ${trial.nctId}`);
        } else {
          extractionErrors.push(trial.nctId);
          addLog(`Failed to extract criteria for ${trial.nctId}: ${result.reason}`);
        }
      });

      const progress = Math.round(((i + batch.length) / trials.length) * 100);
      onProgress(createStep('extractor', 'running', progress), logs);
    }

    completedSteps.push(createStep('extractor', 'complete'));
    onProgress(createStep('extractor', 'complete'), logs);

    // Filter trials with successful extraction
    const trialsWithCriteria = trials.filter((t) => eligibilityMap.has(t.nctId));

    if (trialsWithCriteria.length === 0) {
      addLog('Could not extract criteria for any trials');
      return {
        trials,
        matchResults: [],
        voiceScript: undefined,
        completedSteps: [...completedSteps, createStep('matcher', 'error', undefined, 'No criteria extracted')],
        duration: Date.now() - startTime,
      };
    }

    // ========================================================================
    // Step 3: Matcher - Match Patient Profile
    // ========================================================================
    addLog('Matching your profile against trials...');
    onProgress(createStep('matcher', 'running', 0), logs);

    checkAbort();

    const matchResults: MatchResult[] = [];
    const matchErrors: string[] = [];

    for (let i = 0; i < trialsWithCriteria.length; i += concurrency) {
      checkAbort();

      const batch = trialsWithCriteria.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((trial) => {
          const criteria = eligibilityMap.get(trial.nctId)!;
          return withRetry(() =>
            runMatcherAgent({
              patientProfile,
              eligibilityCriteria: criteria,
              nctId: trial.nctId,
            })
          );
        })
      );

      batchResults.forEach((result, idx) => {
        const trial = batch[idx];
        if (result.status === 'fulfilled') {
          matchResults.push(result.value);
          addLog(`Matched ${trial.nctId}: ${result.value.category} (${result.value.score})`);
        } else {
          matchErrors.push(trial.nctId);
          addLog(`Failed to match ${trial.nctId}: ${result.reason}`);
        }
      });

      const progress = Math.round(((i + batch.length) / trialsWithCriteria.length) * 100);
      onProgress(createStep('matcher', 'running', progress), logs);
    }

    // Sort by score descending
    matchResults.sort((a, b) => b.score - a.score);

    completedSteps.push(createStep('matcher', 'complete'));
    onProgress(createStep('matcher', 'complete'), logs);

    // ========================================================================
    // Step 4: Advocate - Generate Voice Summary
    // ========================================================================
    addLog('Creating your personalized summary...');
    onProgress(createStep('advocate', 'running'), logs);

    checkAbort();

    let voiceScript: VoiceScript | undefined;

    try {
      voiceScript = await withRetry(() =>
        runAdvocateAgent({
          matchResults,
          patientProfile,
          language: patientProfile.languagePreference,
        })
      );
      addLog('Voice summary created successfully');
    } catch (error) {
      addLog(`Voice summary failed: ${error}`);
      // Continue without voice - not a critical failure
    }

    completedSteps.push(createStep('advocate', 'complete'));
    onProgress(createStep('advocate', 'complete'), logs);

    // ========================================================================
    // Return Results
    // ========================================================================
    return {
      trials: trialsWithCriteria,
      matchResults,
      voiceScript,
      completedSteps,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`Pipeline error: ${errorMessage}`);

    // Find the failed step
    const failedStepId = completedSteps.length < PIPELINE_STEPS.length
      ? PIPELINE_STEPS[completedSteps.length].id
      : 'advocate';

    completedSteps.push(createStep(failedStepId as PipelineStep['id'], 'error', undefined, errorMessage));

    throw error;
  }
}

// ============================================================================
// Pipeline Status Utilities
// ============================================================================

/**
 * Get initial pipeline steps (all pending)
 */
export function getInitialSteps(): PipelineStep[] {
  return PIPELINE_STEPS.map((step) => ({
    ...step,
    status: 'pending' as const,
  }));
}

/**
 * Calculate overall pipeline progress
 */
export function calculateOverallProgress(steps: PipelineStep[]): number {
  const weights = { scout: 15, extractor: 35, matcher: 35, advocate: 15 };
  let totalProgress = 0;

  for (const step of steps) {
    const weight = weights[step.id];
    if (step.status === 'complete') {
      totalProgress += weight;
    } else if (step.status === 'running' && step.progress !== undefined) {
      totalProgress += (weight * step.progress) / 100;
    }
  }

  return Math.round(totalProgress);
}

/**
 * Get human-readable status message
 */
export function getStatusMessage(steps: PipelineStep[]): string {
  const currentStep = steps.find((s) => s.status === 'running');
  if (currentStep) {
    return currentStep.name;
  }

  const errorStep = steps.find((s) => s.status === 'error');
  if (errorStep) {
    return `Error: ${errorStep.error || 'Unknown error'}`;
  }

  const allComplete = steps.every((s) => s.status === 'complete');
  if (allComplete) {
    return 'Complete';
  }

  return 'Ready to start';
}
