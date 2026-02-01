import Anthropic from '@anthropic-ai/sdk';
import { getToolhouseApiKey } from './config';

// ============================================================================
// Types
// ============================================================================

export interface ToolhouseClient {
  apiKey: string;
  anthropic: Anthropic;
}

export interface AgentResult<T> {
  output: T;
  success: boolean;
  error?: string;
  metadata: {
    duration: number;
    toolCalls: string[];
    model: string;
  };
}

export interface AgentOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

// ============================================================================
// Agent Bundles Configuration
// ============================================================================

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  'clinical-trial-scout': `You are a Clinical Trial Scout agent. Your task is to search for relevant clinical trials based on patient conditions and preferences.
You have access to the ClinicalTrials.gov API.
Return structured trial data including NCT IDs, titles, phases, sponsors, conditions, interventions, and locations.
Focus on trials that are actively recruiting and match the patient's diagnosis.`,

  'eligibility-extractor': `You are an Eligibility Extractor agent. Your task is to parse and structure eligibility criteria from clinical trial pages.
Extract inclusion and exclusion criteria, categorizing each by type: diagnosis, biomarker, treatment, demographics, or other.
Also extract age requirements and healthy volunteer status.
Return structured eligibility data that can be used for patient matching.`,

  'clinical-matcher': `You are a Clinical Matching Specialist agent. Your task is to compare patient profiles against trial eligibility criteria.
Evaluate hard exclusions first, then assess inclusion alignment.
Calculate a match score (0-100) and categorize as: strong_match (75-100), possible_match (50-74), future_potential (25-49), or not_eligible (0-24).
Provide detailed factor breakdown and a plain-language summary at 8th-grade reading level.`,

  'patient-advocate': `You are a Patient Advocate agent. Your task is to generate compassionate, clear voice scripts for patients.
Write at an 8th-grade reading level with a warm, encouraging tone.
Include: acknowledgment of patient's journey, summary of matches, highlights of top matches, next steps, and required disclaimer.
The script should be 150-200 words (60-90 seconds when spoken).`,
};

// ============================================================================
// Client Creation
// ============================================================================

/**
 * Create a Toolhouse client with Anthropic as the LLM provider
 */
export function createToolhouseClient(apiKey?: string): ToolhouseClient {
  const key = apiKey || getToolhouseApiKey();

  const anthropic = new Anthropic({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });

  return {
    apiKey: key,
    anthropic,
  };
}

// ============================================================================
// Retry Logic
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRateLimited = lastError.message.includes('rate limit');
      const isTimeout = lastError.message.includes('timeout');
      const isRetryable = isRateLimited || isTimeout;

      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================================================
// Agent Execution
// ============================================================================

/**
 * Run an agent with the specified input
 */
export async function runAgent<T>(
  client: ToolhouseClient,
  agentId: string,
  input: unknown,
  options: AgentOptions = {}
): Promise<AgentResult<T>> {
  const { maxRetries = 3, retryDelayMs = 1000 } = options;
  const startTime = Date.now();
  const toolCalls: string[] = [];

  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId];
  if (!systemPrompt) {
    return {
      output: null as T,
      success: false,
      error: `Unknown agent: ${agentId}`,
      metadata: {
        duration: Date.now() - startTime,
        toolCalls: [],
        model: 'unknown',
      },
    };
  }

  try {
    const result = await withRetry(
      async () => {
        const response = await client.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: JSON.stringify(input, null, 2),
            },
          ],
        });

        // Extract text content from response
        const textContent = response.content.find((block) => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No text response from agent');
        }

        // Track tool usage
        response.content.forEach((block) => {
          if (block.type === 'tool_use') {
            toolCalls.push(block.name);
          }
        });

        // Parse JSON response
        const text = textContent.text;
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                          text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonStr) as T;
        }

        // If no JSON found, return text as-is (for advocate agent)
        return { text } as T;
      },
      maxRetries,
      retryDelayMs
    );

    return {
      output: result,
      success: true,
      metadata: {
        duration: Date.now() - startTime,
        toolCalls,
        model: 'claude-sonnet-4-20250514',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Agent ${agentId} failed:`, errorMessage);

    return {
      output: null as T,
      success: false,
      error: errorMessage,
      metadata: {
        duration: Date.now() - startTime,
        toolCalls,
        model: 'claude-sonnet-4-20250514',
      },
    };
  }
}

// ============================================================================
// Specialized Agent Runners
// ============================================================================

import type {
  ScoutInput,
  TrialDiscoveryOutput,
  ExtractorInput,
  EligibilityCriteria,
  MatcherInput,
  MatchResult,
  AdvocateInput,
  VoiceScript,
} from './schemas';

export async function runScoutAgentWithClient(
  client: ToolhouseClient,
  input: ScoutInput
): Promise<AgentResult<TrialDiscoveryOutput>> {
  return runAgent<TrialDiscoveryOutput>(client, 'clinical-trial-scout', input);
}

export async function runExtractorAgentWithClient(
  client: ToolhouseClient,
  input: ExtractorInput
): Promise<AgentResult<EligibilityCriteria>> {
  return runAgent<EligibilityCriteria>(client, 'eligibility-extractor', input);
}

export async function runMatcherAgentWithClient(
  client: ToolhouseClient,
  input: MatcherInput
): Promise<AgentResult<MatchResult>> {
  return runAgent<MatchResult>(client, 'clinical-matcher', input);
}

export async function runAdvocateAgentWithClient(
  client: ToolhouseClient,
  input: AdvocateInput
): Promise<AgentResult<VoiceScript>> {
  return runAgent<VoiceScript>(client, 'patient-advocate', input);
}
