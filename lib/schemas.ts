import { z } from 'zod';

// ============================================================================
// Patient Profile Schema
// ============================================================================

export const StageSchema = z.enum(['I', 'II', 'III', 'IV', 'Unknown']);

export const LanguageSchema = z.enum(['en', 'es', 'zh', 'fr', 'de']);

export const PatientProfileSchema = z.object({
  diagnosis: z.string().min(3, 'Diagnosis must be at least 3 characters'),
  stage: StageSchema,
  biomarkers: z.array(z.string()).default([]),
  ecogScore: z.number().int().min(0).max(4),
  previousTreatments: z.array(z.string()).default([]),
  zipcode: z.string().regex(/^\d{5}$/, 'Zipcode must be 5 digits'),
  travelRadiusMiles: z.number().min(10).max(500).default(50),
  languagePreference: LanguageSchema.default('en'),
});

export type PatientProfile = z.infer<typeof PatientProfileSchema>;

// ============================================================================
// Trial Schema
// ============================================================================

export const PhaseSchema = z.enum(['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'N/A']);

export const LocationSchema = z.object({
  facility: z.string(),
  city: z.string(),
  state: z.string(),
  zipcode: z.string(),
  distance: z.number().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

export const TrialSchema = z.object({
  nctId: z.string().regex(/^NCT\d{8}$/, 'Invalid NCT ID format'),
  title: z.string(),
  phase: PhaseSchema,
  status: z.string(),
  sponsor: z.string(),
  conditions: z.array(z.string()),
  interventions: z.array(z.string()),
  locations: z.array(LocationSchema),
  url: z.string().url(),
});

export type Trial = z.infer<typeof TrialSchema>;

// ============================================================================
// Eligibility Schema
// ============================================================================

export const CriteriaCategorySchema = z.enum([
  'diagnosis',
  'biomarker',
  'treatment',
  'demographics',
  'other',
]);

export type CriteriaCategory = z.infer<typeof CriteriaCategorySchema>;

export const CriterionSchema = z.object({
  criterion: z.string(),
  category: CriteriaCategorySchema,
});

export type Criterion = z.infer<typeof CriterionSchema>;

export const AgeRangeSchema = z.object({
  min: z.number().int().min(0).default(0),
  max: z.number().int().max(120).default(120),
});

export type AgeRange = z.infer<typeof AgeRangeSchema>;

export const EligibilitySchema = z.object({
  nctId: z.string(),
  inclusionCriteria: z.array(CriterionSchema),
  exclusionCriteria: z.array(CriterionSchema),
  ageRange: AgeRangeSchema,
  acceptsHealthyVolunteers: z.boolean().default(false),
  rawText: z.string().optional(),
});

export type EligibilityCriteria = z.infer<typeof EligibilitySchema>;

// ============================================================================
// Match Result Schema
// ============================================================================

export const MatchCategorySchema = z.enum([
  'strong_match',
  'possible_match',
  'future_potential',
  'not_eligible',
]);

export type MatchCategory = z.infer<typeof MatchCategorySchema>;

export const MatchingFactorSchema = z.object({
  factor: z.string(),
  weight: z.number().min(1).max(10),
});

export type MatchingFactor = z.infer<typeof MatchingFactorSchema>;

export const BlockingFactorSchema = z.object({
  factor: z.string(),
  reason: z.string(),
});

export type BlockingFactor = z.infer<typeof BlockingFactorSchema>;

export const MatchResultSchema = z.object({
  nctId: z.string(),
  score: z.number().min(0).max(100),
  category: MatchCategorySchema,
  matchingFactors: z.array(MatchingFactorSchema),
  blockingFactors: z.array(BlockingFactorSchema),
  uncertainFactors: z.array(z.string()),
  summary: z.string(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

// ============================================================================
// Voice Script Schema
// ============================================================================

export const VoiceScriptSchema = z.object({
  text: z.string(),
  audioUrl: z.string().url(),
  duration: z.number().positive(),
  language: z.string(),
});

export type VoiceScript = z.infer<typeof VoiceScriptSchema>;

// ============================================================================
// Pipeline Types
// ============================================================================

export const PipelineStepStatusSchema = z.enum([
  'pending',
  'running',
  'complete',
  'error',
]);

export type PipelineStepStatus = z.infer<typeof PipelineStepStatusSchema>;

export const PipelineStepSchema = z.object({
  id: z.enum(['scout', 'extractor', 'matcher', 'advocate']),
  name: z.string(),
  status: PipelineStepStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;

export const PipelineResultSchema = z.object({
  trials: z.array(TrialSchema),
  matchResults: z.array(MatchResultSchema),
  voiceScript: VoiceScriptSchema.optional(),
  completedSteps: z.array(PipelineStepSchema),
  duration: z.number(),
});

export type PipelineResult = z.infer<typeof PipelineResultSchema>;

// ============================================================================
// Agent Input/Output Types
// ============================================================================

export const ScoutInputSchema = z.object({
  diagnosis: z.string(),
  zipcode: z.string(),
  travelRadiusMiles: z.number(),
  phase: z.array(z.string()).optional(),
});

export type ScoutInput = z.infer<typeof ScoutInputSchema>;

export const TrialDiscoveryOutputSchema = z.object({
  trials: z.array(TrialSchema),
  totalFound: z.number(),
  searchParams: z.record(z.unknown()),
});

export type TrialDiscoveryOutput = z.infer<typeof TrialDiscoveryOutputSchema>;

export const ExtractorInputSchema = z.object({
  nctId: z.string(),
  trialUrl: z.string().url().optional(),
});

export type ExtractorInput = z.infer<typeof ExtractorInputSchema>;

export const MatcherInputSchema = z.object({
  patientProfile: PatientProfileSchema,
  eligibilityCriteria: EligibilitySchema,
  nctId: z.string(),
});

export type MatcherInput = z.infer<typeof MatcherInputSchema>;

export const AdvocateInputSchema = z.object({
  matchResults: z.array(MatchResultSchema),
  patientProfile: PatientProfileSchema,
  language: z.string().default('en'),
});

export type AdvocateInput = z.infer<typeof AdvocateInputSchema>;

// ============================================================================
// Parse Functions
// ============================================================================

export function parsePatientProfile(data: unknown): PatientProfile {
  return PatientProfileSchema.parse(data);
}

export function parseTrial(data: unknown): Trial {
  return TrialSchema.parse(data);
}

export function parseEligibility(data: unknown): EligibilityCriteria {
  return EligibilitySchema.parse(data);
}

export function parseMatchResult(data: unknown): MatchResult {
  return MatchResultSchema.parse(data);
}

export function parseVoiceScript(data: unknown): VoiceScript {
  return VoiceScriptSchema.parse(data);
}

export function parsePipelineResult(data: unknown): PipelineResult {
  return PipelineResultSchema.parse(data);
}

// ============================================================================
// Safe Parse Functions (return result instead of throwing)
// ============================================================================

export function safeParsePatientProfile(data: unknown) {
  return PatientProfileSchema.safeParse(data);
}

export function safeParseTrial(data: unknown) {
  return TrialSchema.safeParse(data);
}

export function safeParseEligibility(data: unknown) {
  return EligibilitySchema.safeParse(data);
}

export function safeParseMatchResult(data: unknown) {
  return MatchResultSchema.safeParse(data);
}

export function safeParseVoiceScript(data: unknown) {
  return VoiceScriptSchema.safeParse(data);
}
