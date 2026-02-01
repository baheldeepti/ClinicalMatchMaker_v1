import { useEffect, useState } from 'react';
import { Check, X, Loader2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import type { PipelineStep } from '../../lib/schemas';

// ============================================================================
// Props
// ============================================================================

interface ProgressIndicatorProps {
  currentStep: number;
  steps: PipelineStep[];
  logs?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const STEP_DESCRIPTIONS: Record<string, string> = {
  scout: 'Searching ClinicalTrials.gov for matching trials...',
  extractor: 'Extracting eligibility criteria from trial pages...',
  matcher: 'Analyzing how well your profile matches each trial...',
  advocate: 'Generating your personalized voice summary...',
};

// ============================================================================
// Components
// ============================================================================

function StepIcon({ status }: { status: PipelineStep['status'] }) {
  switch (status) {
    case 'complete':
      return (
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      );
    case 'running':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      );
    case 'error':
      return (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <Circle className="w-5 h-5 text-gray-400" />
        </div>
      );
  }
}

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="text-sm text-gray-500">
      {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProgressIndicator({ currentStep, steps, logs = [] }: ProgressIndicatorProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [stepStartTimes] = useState<Record<number, number>>({});

  // Track when each step starts
  useEffect(() => {
    if (steps[currentStep]?.status === 'running' && !stepStartTimes[currentStep]) {
      stepStartTimes[currentStep] = Date.now();
    }
  }, [currentStep, steps, stepStartTimes]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = step.status === 'running';
          const isPast = step.status === 'complete';
          const isError = step.status === 'error';

          return (
            <div key={step.id} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-full -ml-px ${
                    isPast ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <StepIcon status={step.status} />

                {/* Content */}
                <div className="flex-1 min-w-0 pb-8">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium ${
                        isActive
                          ? 'text-blue-700'
                          : isPast
                          ? 'text-green-700'
                          : isError
                          ? 'text-red-700'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </h3>

                    {/* Timer for active step */}
                    {isActive && stepStartTimes[index] && (
                      <ElapsedTimer startTime={stepStartTimes[index]} />
                    )}
                  </div>

                  {/* Description or error */}
                  {isActive && (
                    <p className="text-sm text-gray-500 mt-1">
                      {STEP_DESCRIPTIONS[step.id]}
                    </p>
                  )}

                  {isError && step.error && (
                    <p className="text-sm text-red-600 mt-1">{step.error}</p>
                  )}

                  {/* Progress bar for steps with progress */}
                  {isActive && step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {step.progress}% complete
                      </p>
                    </div>
                  )}

                  {/* Completed indicator */}
                  {isPast && (
                    <p className="text-sm text-green-600 mt-1">Completed</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs section */}
      {logs.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showLogs ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Details
              </>
            )}
          </button>

          {showLogs && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              <ul className="space-y-1 text-xs font-mono text-gray-600">
                {logs.slice(-10).map((log, idx) => (
                  <li key={idx}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Overall progress indicator */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}
