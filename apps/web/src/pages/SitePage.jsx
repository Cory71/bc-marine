import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import {
  findObservationSite,
  fetchSiteHistory,
  distanceKm,
  formatDistance,
  formatReadingAge,
  formatWind,
  formatGust,
  formatWaves,
  formatPressure,
  formatTime,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import { useSavedSites } from '../context/useSavedSites.js';
import Card from '../components/Card.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, DetailPlaceholder } from '../components/DetailPage.jsx';
import PanelError from '../components/PanelError.jsx';
import { ReadingStats } from '../components/ObservationTile.jsx';
import SiteCharts from '../components/SiteCharts.jsx';

const TYPE_LABELS = { lighthouse: 'Lighthouse', buoy: 'Buoy' };

// One lighthouse or buoy: its latest reading and the last 12 hours, so you can
// see whether the wind is building, easing or holding steady
export default function SitePage() {
  const { siteId } = useParams();
  const { search } = useLocation();
  const site = findObservationSite(siteId);

  return (
    <div className="detail">
      <Link to={{ pathname: '/observations', search }} className="back-link">
        <Icon name="chevron" size={14} />
        Back to observations
      </Link>
      {site ? (
        <SiteContent site={site} />
      ) : (
        <EmptyState message="We couldn't find that lighthouse or buoy." />
      )}
    </div>
  );
}

function SiteContent({ site }) {
  const { activeStation, units } = useApp();
  const { status, history } = useSiteHistory(site);
  const latest = history[0];
  const distance = distanceKm(activeStation.lat, activeStation.lon, site.lat, site.lon);

  return (
    <>
      <div>
        <div className="site-title">
          <h2 className="detail__title">{site.name}</h2>
          <span className={`obs-badge obs-badge--${site.type}`}>{TYPE_LABELS[site.type]}</span>
          <SaveSiteButton site={site} />
        </div>
        <p className="detail__source">
          {formatDistance(distance, units)} from {activeStation.name} ·{' '}
          {site.type === 'buoy' ? 'NOAA NDBC' : 'Environment Canada'}
        </p>
      </div>

      {status === 'loading' && <DetailPlaceholder />}
      {status === 'failed' && <PanelError message="Readings unavailable. Try again shortly." />}
      {status === 'ready' && !latest && <EmptyState message="No recent reports from this site." />}
      {status === 'ready' && latest && (
        <>
          <Card title={`Latest · ${formatReadingAge(latest.observedAt)}`}>
            <ReadingStats reading={latest} units={units} />
          </Card>
          <Card title="12-hour trend">
            <SiteCharts history={history} units={units} />
          </Card>
          <Card title="Last 12 hours">
            <HourlyTable history={history} showWaves={site.type === 'buoy'} />
          </Card>
        </>
      )}
    </>
  );
}

// Star button that saves the site to the sidebar's list on this device
function SaveSiteButton({ site }) {
  const { isSiteSaved, toggleSavedSite } = useSavedSites();
  const isSaved = isSiteSaved(site.id);

  return (
    <button
      type="button"
      className="save-button"
      aria-pressed={isSaved}
      onClick={() => toggleSavedSite(site.id)}
    >
      <Icon name="star" size={16} />
      Save <span className="visually-hidden">{site.name}</span>
    </button>
  );
}

// Load a site's history. Loading is worked out from which site the data belongs to,
// so switching sites never shows the previous site's readings.
function useSiteHistory(site) {
  const [result, setResult] = useState({ siteId: null, history: [], failed: false });

  useEffect(() => {
    let isCurrent = true;
    fetchSiteHistory(site)
      .then(history => isCurrent && setResult({ siteId: site.id, history, failed: false }))
      .catch(() => isCurrent && setResult({ siteId: site.id, history: [], failed: true }));
    return () => {
      isCurrent = false;
    };
  }, [site]);

  if (result.siteId !== site.id) return { status: 'loading', history: [] };
  return { status: result.failed ? 'failed' : 'ready', history: result.history };
}

function HourlyTable({ history, showWaves }) {
  const { units } = useApp();
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Wind</th>
            <th scope="col">Gust</th>
            {showWaves && <th scope="col">Waves</th>}
            <th scope="col">Pressure</th>
          </tr>
        </thead>
        <tbody>
          {history.map(reading => (
            <tr key={reading.observedAt.toISOString()}>
              <th scope="row">{formatTime(reading.observedAt)}</th>
              <td>{formatWind(reading, units)}</td>
              <td>{formatGust(reading, units)}</td>
              {showWaves && <td>{formatWaves(reading, units)}</td>}
              <td>{formatPressure(reading, units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
