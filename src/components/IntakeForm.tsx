import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PatientProfile } from '../../lib/schemas';
import { z } from 'zod';

// ============================================================================
// Form Schema (extends PatientProfile with string biomarkers for input)
// ============================================================================

const FormSchema = z.object({
  diagnosis: z.string().min(3, 'Diagnosis must be at least 3 characters'),
  stage: z.enum(['I', 'II', 'III', 'IV', 'Unknown']),
  biomarkers: z.string().optional().default(''),
  ecogScore: z.union([z.string(), z.number()]).transform(val => Number(val)),
  previousTreatments: z.array(z.string()).default([]),
  zipcode: z.string().min(5, 'Zipcode must be 5 digits').max(5, 'Zipcode must be 5 digits'),
  travelRadiusMiles: z.union([z.string(), z.number()]).transform(val => Number(val) || 50),
  languagePreference: z.enum(['en', 'es', 'zh', 'fr', 'de']).default('en'),
});

type FormData = z.infer<typeof FormSchema>;

// ============================================================================
// Props
// ============================================================================

interface IntakeFormProps {
  onSubmit: (data: PatientProfile) => Promise<void>;
  isLoading?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ECOG_DESCRIPTIONS: Record<number, string> = {
  0: 'Fully active, able to carry on all pre-disease activities',
  1: 'Restricted in physically strenuous activity but ambulatory',
  2: 'Ambulatory and capable of all self-care but unable to work',
  3: 'Capable of only limited self-care; confined to bed >50% of waking hours',
  4: 'Completely disabled; cannot carry on any self-care',
};

const TREATMENT_OPTIONS = [
  'Chemotherapy',
  'Radiation therapy',
  'Immunotherapy',
  'Targeted therapy',
  'Surgery',
  'Hormone therapy',
  'None',
];

const STAGE_OPTIONS = ['I', 'II', 'III', 'IV', 'Unknown'] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
] as const;

// ============================================================================
// Component
// ============================================================================

export function IntakeForm({ onSubmit, isLoading = false }: IntakeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      diagnosis: '',
      stage: 'Unknown',
      biomarkers: '',
      ecogScore: 0,
      previousTreatments: [],
      zipcode: '',
      travelRadiusMiles: 50,
      languagePreference: 'en',
    },
  });

  const travelRadius = watch('travelRadiusMiles');
  const ecogScore = watch('ecogScore');

  const handleFormSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    // Transform the data for PatientProfile
    const profile: PatientProfile = {
      diagnosis: data.diagnosis,
      stage: data.stage,
      biomarkers: data.biomarkers
        ? String(data.biomarkers).split(',').map((b) => b.trim()).filter(Boolean)
        : [],
      ecogScore: Number(data.ecogScore),
      previousTreatments: data.previousTreatments || [],
      zipcode: data.zipcode,
      travelRadiusMiles: Number(data.travelRadiusMiles) || 50,
      languagePreference: data.languagePreference || 'en',
    };
    console.log('Submitting profile:', profile);
    await onSubmit(profile);
  };

  const onError = (formErrors: unknown) => {
    console.error('Form validation errors:', formErrors);
    alert('Please fix form errors: ' + JSON.stringify(formErrors));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, onError)} className="space-y-6">
      {/* Show all errors at top */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{field}: {(error as { message?: string })?.message || 'Invalid'}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Diagnosis */}
      <div>
        <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
          Diagnosis / Condition *
        </label>
        <input
          type="text"
          id="diagnosis"
          {...register('diagnosis')}
          placeholder="e.g., Non-small cell lung cancer"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={isLoading}
        />
        {errors.diagnosis && (
          <p className="mt-1 text-sm text-red-600">{errors.diagnosis.message}</p>
        )}
      </div>

      {/* Stage and ECOG Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Stage */}
        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
            Cancer Stage *
          </label>
          <select
            id="stage"
            {...register('stage')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          >
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                Stage {stage}
              </option>
            ))}
          </select>
          {errors.stage && (
            <p className="mt-1 text-sm text-red-600">{errors.stage.message}</p>
          )}
        </div>

        {/* ECOG Score */}
        <div>
          <label htmlFor="ecogScore" className="block text-sm font-medium text-gray-700">
            ECOG Performance Status *
          </label>
          <select
            id="ecogScore"
            {...register('ecogScore', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          >
            {[0, 1, 2, 3, 4].map((score) => (
              <option key={score} value={score}>
                {score} - {ECOG_DESCRIPTIONS[score].slice(0, 40)}...
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {ECOG_DESCRIPTIONS[ecogScore]}
          </p>
        </div>
      </div>

      {/* Biomarkers */}
      <div>
        <label htmlFor="biomarkers" className="block text-sm font-medium text-gray-700">
          Known Biomarkers
        </label>
        <input
          type="text"
          id="biomarkers"
          {...register('biomarkers')}
          placeholder="e.g., EGFR+, PD-L1 >50%, ALK negative"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate multiple biomarkers with commas
        </p>
      </div>

      {/* Previous Treatments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Previous Treatments
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TREATMENT_OPTIONS.map((treatment) => (
            <label
              key={treatment}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                value={treatment}
                {...register('previousTreatments')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              {treatment}
            </label>
          ))}
        </div>
      </div>

      {/* Location Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Zipcode */}
        <div>
          <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700">
            Zipcode *
          </label>
          <input
            type="text"
            id="zipcode"
            {...register('zipcode')}
            placeholder="e.g., 10001"
            maxLength={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          />
          {errors.zipcode && (
            <p className="mt-1 text-sm text-red-600">{errors.zipcode.message}</p>
          )}
        </div>

        {/* Travel Radius */}
        <div>
          <label htmlFor="travelRadius" className="block text-sm font-medium text-gray-700">
            Travel Radius: {travelRadius} miles
          </label>
          <input
            type="range"
            id="travelRadius"
            min={10}
            max={200}
            step={10}
            {...register('travelRadiusMiles', { valueAsNumber: true })}
            className="mt-2 w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10 mi</span>
            <span>200 mi</span>
          </div>
        </div>
      </div>

      {/* Language Preference */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
          Preferred Language for Results
        </label>
        <select
          id="language"
          {...register('languagePreference')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={isLoading}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-gray-500">
        Your information is used only for matching and is not stored or shared.
      </p>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Find Matching Trials'
        )}
      </button>
    </form>
  );
}
