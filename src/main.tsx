import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ============================================================================
// Root Element Validation
// ============================================================================

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Failed to find the root element. ' +
    'Make sure there is a <div id="root"></div> in your index.html file.'
  );
}

// ============================================================================
// Render Application
// ============================================================================

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
