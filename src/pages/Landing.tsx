import { Link } from 'react-router-dom';
import { Search, Brain, MessageSquare, Stethoscope, Shield, Database } from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

// ============================================================================
// Component
// ============================================================================

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Hero Section */}
      <section className="px-4 pt-16 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Find Clinical Trials That Match{' '}
            <span className="text-blue-600">Your Profile</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            AI-powered matching helps you discover relevant clinical trials based on your
            diagnosis, biomarkers, and treatment history. Get personalized results in minutes.
          </p>
          <div className="mt-10">
            <Link
              to="/intake"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all"
            >
              Find My Matches
              <Search className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Free to get started • No account required
            </p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Why Clinical Trial Matching Matters
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
            Finding the right clinical trial can be overwhelming. With thousands of active
            studies and complex eligibility criteria, many patients miss opportunities that
            could benefit their treatment journey.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-blue-600">50,000+</div>
              <p className="mt-2 text-gray-600">Active trials on ClinicalTrials.gov</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-blue-600">80%</div>
              <p className="mt-2 text-gray-600">Of trials struggle to meet enrollment goals</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-blue-600">3%</div>
              <p className="mt-2 text-gray-600">Of cancer patients participate in trials</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Enter Your Profile</h3>
              <p className="text-sm text-gray-600">
                Share your diagnosis, biomarkers, and treatment history
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Searches Trials</h3>
              <p className="text-sm text-gray-600">
                Our system scans thousands of actively recruiting trials
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Match Scores</h3>
              <p className="text-sm text-gray-600">
                See how well you match each trial's eligibility criteria
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Review with Doctor</h3>
              <p className="text-sm text-gray-600">
                Share results with your healthcare team to discuss options
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Matching</h3>
                <p className="text-gray-600">
                  Advanced algorithms analyze eligibility criteria and compare against your profile
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Plain-Language Results</h3>
                <p className="text-gray-600">
                  No medical jargon — understand why you do or don't match each trial
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Voice Summaries</h3>
                <p className="text-gray-600">
                  Listen to a personalized audio summary of your results
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Official Data Source</h3>
                <p className="text-gray-600">
                  All trials come directly from ClinicalTrials.gov, the official US registry
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Matters</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                Your information is used only for matching and is never stored
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                We don't sell or share your data with third parties
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                This tool is informational only — always consult your doctor
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Find Your Matches?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            It only takes a few minutes to get personalized clinical trial recommendations.
          </p>
          <Link
            to="/intake"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <DisclaimerBanner />
    </div>
  );
}
