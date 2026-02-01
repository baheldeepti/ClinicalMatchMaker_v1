import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useSession } from '../context/SessionContext';
import { runPipeline, getInitialSteps } from '../../lib/orchestrator';
import type { PipelineStep } from '../../lib/schemas';

// ============================================================================
// Component
// ============================================================================

export function Processing() {
  const navigate = useNavigate();
  const { patientProfile, setPipelineResults } = useSession();
  const [steps, setSteps] = useState<PipelineStep[]>(getInitialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasStartedRef = useRef(false);

  // Redirect if no patient profile
  useEffect(() => {
    if (!patientProfile) {
      navigate('/intake');
    }
  }, [patientProfile, navigate]);

  // Run pipeline
  const runPipelineWithProgress = useCallback(async () => {
    if (!patientProfile || hasStartedRef.current) return;

    hasStartedRef.current = true;
    setError(null);
    setSteps(getInitialSteps());
    setCurrentStep(0);
    setLogs([]);

    abortControllerRef.current = new AbortController();

    try {
      const results = await runPipeline(
        patientProfile,
        (step, stepLogs) => {
          setSteps((prev) => {
            const newSteps = [...prev];
            const stepIndex = newSteps.findIndex((s) => s.id === step.id);
            if (stepIndex >= 0) {
              newSteps[stepIndex] = step;
              // Update current step to the latest running or completed step
              if (step.status === 'running') {
                setCurrentStep(stepIndex);
              }
            }
            return newSteps;
          });

          if (stepLogs) {
            setLogs(stepLogs);
          }
        },
        {
          abortSignal: abortControllerRef.current.signal,
        }
      );

      // Store results and navigate
      setPipelineResults(results);
      navigate('/results');
    } catch (err) {
      if (err instanceof Error && err.message === 'Pipeline cancelled by user') {
        navigate('/intake');
        return;
      }

      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }, [patientProfile, navigate, setPipelineResults]);

  // Start pipeline on mount
  useEffect(() => {
    runPipelineWithProgress();

    return () => {
      // Cleanup on unmount
      abortControllerRef.current?.abort();
    };
  }, [runPipelineWithProgress]);

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!error) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [error]);

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true);
    hasStartedRef.current = false;
    setError(null);
    runPipelineWithProgress().finally(() => setIsRetrying(false));
  };

  // Handle cancel
  const handleCancel = () => {
    abortControllerRef.current?.abort();
    navigate('/intake');
  };

  if (!patientProfile) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-gray-900">
            Finding Your Matches
          </h1>
          <p className="mt-2 text-gray-600">
            This may take a moment while we analyze available trials...
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <ProgressIndicator
            currentStep={currentStep}
            steps={steps}
            logs={logs}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Something went wrong</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/intake')}
                    className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Modify Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {!error && (
          <div className="mt-8 text-center">
            <button
              onClick={handleCancel}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel and go back
            </button>
          </div>
        )}

        {/* Fun Facts (while waiting) */}
        {!error && (
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Did you know?</h3>
            <p className="text-sm text-blue-800">
              Clinical trials are essential for developing new treatments. They help
              researchers understand how well new medicines work and what side effects
              they might cause. Every approved treatment was once tested in a clinical trial.
            </p>
          </div>
        )}
      </main>

      <DisclaimerBanner />
    </div>
  );
}
