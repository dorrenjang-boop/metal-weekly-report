import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to inject the team password
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  
  // We only intercept headers if it's a plain object (not Headers instance) for simplicity in this app,
  // but since we control all fetch calls, this simple interceptor is sufficient.
  const password = localStorage.getItem('team_password');
  if (password) {
    if (config.headers instanceof Headers) {
      config.headers.append('x-team-password', password);
    } else {
      config.headers['x-team-password'] = password;
    }
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
