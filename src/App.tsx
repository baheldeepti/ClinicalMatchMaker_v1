import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { SessionProvider } from './context/SessionContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// ============================================================================
// Lazy-loaded Pages
// ============================================================================

const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Intake = lazy(() => import('./pages/Intake').then((m) => ({ default: m.Intake })));
const Processing = lazy(() => import('./pages/Processing').then((m) => ({ default: m.Processing })));
const Results = lazy(() => import('./pages/Results').then((m) => ({ default: m.Results })));

// ============================================================================
// Loading Fallback
// ============================================================================

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// App Component
// ============================================================================

export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/intake" element={<Intake />} />
              <Route path="/processing" element={<Processing />} />
              <Route path="/results" element={<Results />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SessionProvider>
    </ErrorBoundary>
  );
}
