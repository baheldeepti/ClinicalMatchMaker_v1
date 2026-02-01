import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IntakeForm } from '../components/IntakeForm';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useSession } from '../context/SessionContext';
import type { PatientProfile } from '../../lib/schemas';

// ============================================================================
// Component
// ============================================================================

export function Intake() {
  const navigate = useNavigate();
  const { setPatientProfile } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PatientProfile) => {
    console.log('Intake handleSubmit called with:', data);
    setIsLoading(true);
    setError(null);

    try {
      // Store patient profile in session context
      console.log('Setting patient profile...');
      setPatientProfile(data);

      // Navigate to processing page
      console.log('Navigating to /processing...');
      navigate('/processing');
    } catch (err) {
      console.error('Intake handleSubmit error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Tell Us About Yourself
            </h1>
            <p className="mt-2 text-gray-600">
              This information helps us find clinical trials that match your medical profile.
              All fields marked with * are required.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <IntakeForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check with your oncologist for accurate information about your
            diagnosis, biomarkers, and treatment history.
          </p>
        </div>
      </main>

      <DisclaimerBanner />
    </div>
  );
}
