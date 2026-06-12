import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Dynamic API URL resolution for separate frontend/backend deployments
const apiBase = (import.meta as any).env?.VITE_API_URL || '';
if (apiBase) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return originalFetch(`${apiBase.replace(/\/$/, '')}${input}`, init);
    }
    return originalFetch(input, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
