import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { TrialCard } from '../components/TrialCard';
import { MatchPieChart } from '../components/MatchPieChart';
import { AudioPlayer } from '../components/AudioPlayer';
import { PaymentModal } from '../components/PaymentModal';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useSession } from '../context/SessionContext';
import {
  handlePaymentRedirect,
  getRemainingFreeMatches,
  hasUnlimitedMatches,
} from '../../lib/stripe';
import type { MatchCategory, MatchResult, Trial } from '../../lib/schemas';

// ============================================================================
// Types
// ============================================================================

type FilterCategory = MatchCategory | 'all';
type SortOption = 'score' | 'distance';

// ============================================================================
// Component
// ============================================================================

export function Results() {
  const navigate = useNavigate();
  useSearchParams(); // Used for payment redirect handling
  const { patientProfile, pipelineResults, clearSession } = useSession();

  // State
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [showProfileSummary, setShowProfileSummary] = useState(false);

  // Redirect if no results
  useEffect(() => {
    if (!pipelineResults || !patientProfile) {
      navigate('/intake');
    }
  }, [pipelineResults, patientProfile, navigate]);

  // Handle payment redirect
  useEffect(() => {
    const { success, cancelled } = handlePaymentRedirect();
    if (success) {
      setPaymentMessage('Payment successful! You now have unlimited matches.');
    } else if (cancelled) {
      setPaymentMessage('Payment was cancelled.');
    }
  }, []);

  // Check free matches
  useEffect(() => {
    if (!hasUnlimitedMatches() && getRemainingFreeMatches() <= 0) {
      setShowPaymentModal(true);
    }
  }, []);

  if (!pipelineResults || !patientProfile) {
    return null;
  }

  const { trials, matchResults, voiceScript } = pipelineResults;

  // Create a map of nctId to trial for easy lookup
  const trialMap = new Map<string, Trial>(
    trials.map((trial) => [trial.nctId, trial])
  );

  // Filter and sort results
  const filteredResults = matchResults.filter((result) => {
    if (filterCategory === 'all') return true;
    return result.category === filterCategory;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    }
    // Sort by distance
    const trialA = trialMap.get(a.nctId);
    const trialB = trialMap.get(b.nctId);
    const distA = trialA?.locations[0]?.distance ?? Infinity;
    const distB = trialB?.locations[0]?.distance ?? Infinity;
    return distA - distB;
  });

  // Group by category for display
  const strongMatches = sortedResults.filter((r) => r.category === 'strong_match');
  const possibleMatches = sortedResults.filter((r) => r.category === 'possible_match');
  const futureMatches = sortedResults.filter((r) => r.category === 'future_potential');
  const notEligible = sortedResults.filter((r) => r.category === 'not_eligible');

  const handleStartOver = () => {
    clearSession();
    navigate('/');
  };

  const renderTrialSection = (
    title: string,
    results: MatchResult[],
    _defaultOpen = true
  ) => {
    if (results.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title} ({results.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((result) => {
            const trial = trialMap.get(result.nctId);
            if (!trial) return null;
            return (
              <TrialCard key={result.nctId} trial={trial} matchResult={result} />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              Your Clinical Trial Matches
            </h1>
            <button
              onClick={handleStartOver}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </button>
          </div>
        </div>
      </header>

      {/* Payment Message */}
      {paymentMessage && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{paymentMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Summary text */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                We found {trials.length} trials that may be relevant
              </h2>
              <p className="text-gray-600 mb-4">
                Based on your profile, we've analyzed each trial's eligibility criteria
                and scored how well you match.
              </p>

              {/* Patient Profile Summary */}
              <button
                onClick={() => setShowProfileSummary(!showProfileSummary)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                {showProfileSummary ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide your profile
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    View your profile
                  </>
                )}
              </button>

              {showProfileSummary && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm">
                  <dl className="grid grid-cols-2 gap-2">
                    <dt className="text-gray-500">Diagnosis:</dt>
                    <dd className="text-gray-900">{patientProfile.diagnosis}</dd>
                    <dt className="text-gray-500">Stage:</dt>
                    <dd className="text-gray-900">{patientProfile.stage}</dd>
                    <dt className="text-gray-500">ECOG Score:</dt>
                    <dd className="text-gray-900">{patientProfile.ecogScore}</dd>
                    <dt className="text-gray-500">Location:</dt>
                    <dd className="text-gray-900">
                      {patientProfile.zipcode} (within {patientProfile.travelRadiusMiles} mi)
                    </dd>
                    {patientProfile.biomarkers.length > 0 && (
                      <>
                        <dt className="text-gray-500">Biomarkers:</dt>
                        <dd className="text-gray-900">
                          {patientProfile.biomarkers.join(', ')}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}
            </div>

            {/* Right: Pie Chart */}
            <div className="w-full md:w-80">
              <MatchPieChart matchResults={matchResults} />
            </div>
          </div>
        </div>

        {/* Audio Summary */}
        {voiceScript && voiceScript.audioUrl && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Listen to Your Summary
            </h2>
            <AudioPlayer
              audioUrl={voiceScript.audioUrl}
              transcript={voiceScript.text}
              duration={voiceScript.duration}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="strong_match">Strong Matches</option>
                  <option value="possible_match">Possible Matches</option>
                  <option value="future_potential">Future Potential</option>
                  <option value="not_eligible">Not Eligible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="score">Match Score</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Trial Results */}
        {filterCategory === 'all' ? (
          <>
            {renderTrialSection('Strong Matches', strongMatches)}
            {renderTrialSection('Possible Matches', possibleMatches)}
            {renderTrialSection('Future Potential', futureMatches)}
            {renderTrialSection('Not Currently Eligible', notEligible, false)}
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedResults.map((result) => {
              const trial = trialMap.get(result.nctId);
              if (!trial) return null;
              return (
                <TrialCard key={result.nctId} trial={trial} matchResult={result} />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {sortedResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No trials match the selected filter.</p>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        remainingFreeMatches={getRemainingFreeMatches()}
      />

      <DisclaimerBanner />
    </div>
  );
}
