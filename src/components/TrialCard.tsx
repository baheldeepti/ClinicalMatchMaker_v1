import { Check, X, HelpCircle, ExternalLink, MapPin } from 'lucide-react';
import type { Trial, MatchResult } from '../../lib/schemas';

// ============================================================================
// Props
// ============================================================================

interface TrialCardProps {
  trial: Trial;
  matchResult: MatchResult;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_STYLES = {
  strong_match: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    label: 'Strong Match',
  },
  possible_match: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    label: 'Possible Match',
  },
  future_potential: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    label: 'Future Potential',
  },
  not_eligible: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    label: 'Not Eligible',
  },
};

const MAX_FACTORS_SHOWN = 3;

// ============================================================================
// Component
// ============================================================================

export function TrialCard({ trial, matchResult }: TrialCardProps) {
  const categoryStyle = CATEGORY_STYLES[matchResult.category];
  const nearestLocation = trial.locations[0];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {trial.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{trial.nctId}</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
            {trial.phase}
          </span>
        </div>
      </div>

      {/* Score Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Score Circle */}
          <div
            className={`flex-shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center ${categoryStyle.bg} ${categoryStyle.border} border-2`}
          >
            <span className={`text-2xl font-bold ${categoryStyle.text}`}>
              {matchResult.score}
            </span>
          </div>

          {/* Category and Summary */}
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
            >
              {categoryStyle.label}
            </span>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {matchResult.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Factors Section */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        {/* Matching Factors */}
        {matchResult.matchingFactors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Matching Factors
            </p>
            <ul className="space-y-1">
              {matchResult.matchingFactors.slice(0, MAX_FACTORS_SHOWN).map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{factor.factor}</span>
                </li>
              ))}
              {matchResult.matchingFactors.length > MAX_FACTORS_SHOWN && (
                <li className="text-xs text-gray-500 ml-6">
                  +{matchResult.matchingFactors.length - MAX_FACTORS_SHOWN} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Blocking Factors */}
        {matchResult.blockingFactors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Concerns
            </p>
            <ul className="space-y-1">
              {matchResult.blockingFactors.slice(0, MAX_FACTORS_SHOWN).map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                  <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{factor.reason}</span>
                </li>
              ))}
              {matchResult.blockingFactors.length > MAX_FACTORS_SHOWN && (
                <li className="text-xs text-gray-500 ml-6">
                  +{matchResult.blockingFactors.length - MAX_FACTORS_SHOWN} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Uncertain Factors */}
        {matchResult.uncertainFactors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Needs Confirmation
            </p>
            <ul className="space-y-1">
              {matchResult.uncertainFactors.slice(0, MAX_FACTORS_SHOWN).map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{factor}</span>
                </li>
              ))}
              {matchResult.uncertainFactors.length > MAX_FACTORS_SHOWN && (
                <li className="text-xs text-gray-500 ml-6">
                  +{matchResult.uncertainFactors.length - MAX_FACTORS_SHOWN} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Location Section */}
      {nearestLocation && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <div>
              <p className="font-medium">{nearestLocation.facility}</p>
              <p>
                {nearestLocation.city}, {nearestLocation.state}
                {nearestLocation.distance !== undefined && (
                  <span className="text-gray-500">
                    {' '}
                    • {nearestLocation.distance} miles
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Sponsor: {trial.sponsor}
        </p>
        <a
          href={trial.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          aria-label={`Learn more about trial ${trial.nctId} on ClinicalTrials.gov`}
        >
          Learn More
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
