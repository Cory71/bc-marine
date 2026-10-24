import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureEcFeedUrl } from '@bc-marine/shared';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

// Browsers can't read EC feeds directly (no CORS), so go through our proxy
configureEcFeedUrl(code => `/api/ec-feed?code=${code}`);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
