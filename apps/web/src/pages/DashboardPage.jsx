import {
  findClosestReading,
  getNextTideEvent,
  getCurrentPhase,
  hasCurrentData,
  getSunMoon,
  degreesToCardinal,
  formatTime,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import Card from '../components/Card.jsx';
import Stat from '../components/Stat.jsx';
import TideCurve from '../components/TideCurve.jsx';
import Skeleton from '../components/Skeleton.jsx';
import PanelError from '../components/PanelError.jsx';

const NO_VALUE = '--';

// At-a-glance conditions for the active station
export default function DashboardPage() {
  const { loading, lastUpdated } = useApp();
  // Skeletons only before the first load; a refresh keeps the old numbers on screen
  if (loading && !lastUpdated) return <DashboardSkeleton />;

  return (
    <div className={`dashboard ${loading ? 'is-refreshing' : ''}`} aria-busy={loading}>
      <div className="card-grid">
        <WindCard />
        <WavesCard />
        <VisibilityCard />
        <TideNowCard />
        <CurrentsCard />
        <SunMoonCard />
      </div>
      <TideChartCard />
      <ForecastCard />
    </div>
  );
}

// True when a source failed and there's no earlier data to fall back on
function useIsUnavailable(key, data) {
  const { failures } = useApp();
  return failures.includes(key) && (!data || data.length === 0);
}

function useCurrentWeather() {
  const { weather } = useApp();
  return { weather, now: findClosestReading(weather), unavailable: useIsUnavailable('weather', weather) };
}

function WindCard() {
  const { now, unavailable } = useCurrentWeather();
  const direction = now?.windDirectionDeg != null ? degreesToCardinal(now.windDirectionDeg) : '';
  const speed = now?.windSpeedKts != null ? Math.round(now.windSpeedKts) : NO_VALUE;
  return (
    <Card title="Wind" to="/weather">
      {unavailable ? <PanelError message="Weather unavailable" /> : <Stat label="Now" value={`${direction} ${speed} kts`.trim()} />}
    </Card>
  );
}

function WavesCard() {
  const { now, unavailable } = useCurrentWeather();
  const swell = now?.swellHeightFt != null ? `Swell ${now.swellHeightFt} ft` : undefined;
  return (
    <Card title="Waves" to="/weather">
      {unavailable ? (
        <PanelError message="Weather unavailable" />
      ) : (
        <Stat label="Height" value={`${now?.waveHeightFt ?? NO_VALUE} ft`} detail={swell} />
      )}
    </Card>
  );
}

function VisibilityCard() {
  const { now, unavailable } = useCurrentWeather();
  const visibility = now?.visibilityKm != null ? Math.round(now.visibilityKm) : NO_VALUE;
  return (
    <Card title="Visibility">
      {unavailable ? <PanelError message="Weather unavailable" /> : <Stat label="Now" value={`${visibility} km`} />}
    </Card>
  );
}

function TideNowCard() {
  const { tides, tideEvents } = useApp();
  const unavailable = useIsUnavailable('tides', tides);
  const current = findClosestReading(tides);
  const nextHigh = getNextTideEvent(tideEvents, 'HIGH');
  const nextLow = getNextTideEvent(tideEvents, 'LOW');

  return (
    <Card title="Tide" to="/tides">
      {unavailable ? (
        <PanelError message="Tides unavailable" />
      ) : (
        <>
          <Stat label="Now" value={current ? `${current.heightFt} ft` : NO_VALUE} />
          <p className="card__note numeric">
            High {nextHigh ? formatTime(nextHigh.time) : NO_VALUE} · Low{' '}
            {nextLow ? formatTime(nextLow.time) : NO_VALUE}
          </p>
        </>
      )}
    </Card>
  );
}

function CurrentsCard() {
  const { weather, now, unavailable } = useCurrentWeather();
  const phase = getCurrentPhase(weather);
  const phaseTone = { Flooding: 'safe', Ebbing: 'warning' }[phase];

  let content;
  if (unavailable) content = <PanelError message="Currents unavailable" />;
  else if (!hasCurrentData(weather)) content = <p className="card__note">No current data for this station.</p>;
  else {
    const direction = now?.currentDirectionDeg != null ? degreesToCardinal(now.currentDirectionDeg) : NO_VALUE;
    content = (
      <>
        <Stat label="Speed" value={`${now?.currentSpeedKts?.toFixed(1) ?? NO_VALUE} kts`} detail={direction} />
        <p className={`card__note stat__value--${phaseTone ?? 'muted'}`}>{phase ?? NO_VALUE}</p>
      </>
    );
  }

  return (
    <Card title="Currents" to="/currents">
      {content}
    </Card>
  );
}

function SunMoonCard() {
  const { activeStation } = useApp();
  const { sunrise, sunset, moonPhase } = getSunMoon(activeStation.lat, activeStation.lon);
  return (
    <Card title="Sun & Moon">
      <div className="stat-row">
        <Stat label="Sunrise" value={sunrise} />
        <Stat label="Sunset" value={sunset} />
      </div>
      <p className="card__note">{moonPhase}</p>
    </Card>
  );
}

function TideChartCard() {
  const { tides, tideEvents } = useApp();
  const unavailable = useIsUnavailable('tides', tides);
  return (
    <Card title="Today's tide" to="/tides" className="card--wide">
      {unavailable ? <PanelError message="Tides unavailable" /> : <TideCurve tides={tides} events={tideEvents} />}
    </Card>
  );
}

function ForecastCard() {
  const { marineForecast, activeStation } = useApp();
  const unavailable = useIsUnavailable('marineForecast', marineForecast.forecast);
  return (
    <Card title="Marine forecast" className="card--wide">
      {unavailable ? (
        <PanelError message="Forecast unavailable" />
      ) : (
        <>
          <p className="forecast-text">{tidyForecastText(marineForecast.forecast) || NO_VALUE}</p>
          <p className="card__source">Source: Environment Canada · {activeStation.region}</p>
        </>
      )}
    </Card>
  );
}

// EC hard-wraps its text mid-sentence. Join those lines, but keep "Issued ..." on its own line.
function tidyForecastText(text) {
  return text.replace(/\s*\n(?!Issued)\s*/g, ' ');
}

// Placeholder layout with the same shape as the real dashboard
function DashboardSkeleton() {
  return (
    <div className="dashboard" aria-busy="true">
      <p className="visually-hidden">Loading marine data…</p>
      <div className="card-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card">
            <Skeleton width="40%" height={12} />
            <Skeleton width="70%" height={28} />
          </div>
        ))}
      </div>
      <div className="card card--wide">
        <Skeleton height={240} />
      </div>
      <div className="card card--wide">
        <Skeleton height={14} />
        <Skeleton height={14} width="85%" />
        <Skeleton height={14} width="60%" />
      </div>
    </div>
  );
}
