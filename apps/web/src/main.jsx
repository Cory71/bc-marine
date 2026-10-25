import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureEcFeedUrl, configureBuoyFeedUrl } from '@bc-marine/shared';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

// Browsers can't read EC forecast feeds or NOAA buoy files directly (no CORS), so use our relays
configureEcFeedUrl(code => `/api/ec-feed?code=${code}`);
configureBuoyFeedUrl(id => `/api/buoy-feed?id=${id}`);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
