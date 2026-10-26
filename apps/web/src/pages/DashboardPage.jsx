import {
  findClosestReading,
  getNextTideEvent,
  getCurrentPhase,
  hasCurrentData,
  getSunMoon,
  degreesToCardinal,
  formatTime,
  tidyForecastText,
  formatSpeed,
  formatHeight,
  formatDistance,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import Card from '../components/Card.jsx';
import Stat from '../components/Stat.jsx';
import TideCurve from '../components/TideCurve.jsx';
import Skeleton from '../components/Skeleton.jsx';
import SourceContent from '../components/SourceContent.jsx';
import NearbyObservationsCard from '../components/NearbyObservationsCard.jsx';

const NO_VALUE = '--';

// At-a-glance conditions for the active station. Each card fills in as soon as
// its own data source arrives, instead of waiting for the slowest one.
export default function DashboardPage() {
  const { loading, lastUpdated } = useApp();
  // Fade the old numbers slightly while a refresh is running
  const isRefreshing = loading && Boolean(lastUpdated);

  return (
    <div className={`dashboard ${isRefreshing ? 'is-refreshing' : ''}`} aria-busy={loading}>
      {/* Forecast first: it's what mariners check before anything else (same as mobile) */}
      <Card title="Marine forecast" className="card--wide">
        <SourceContent
          source="marineForecast"
          errorMessage="Forecast unavailable"
          placeholder={<ForecastPlaceholder />}
        >
          <ForecastText />
        </SourceContent>
      </Card>

      <div className="card-grid">
        <Card title="Wind" to="/weather">
          <SourceContent source="weather" errorMessage="Weather unavailable">
            <WindReading />
          </SourceContent>
        </Card>
        <Card title="Waves" to="/weather">
          <SourceContent source="weather" errorMessage="Weather unavailable">
            <WavesReading />
          </SourceContent>
        </Card>
        <Card title="Visibility">
          <SourceContent source="weather" errorMessage="Weather unavailable">
            <VisibilityReading />
          </SourceContent>
        </Card>
        <Card title="Tide" to="/tides">
          <SourceContent source="tides" errorMessage="Tides unavailable">
            <TideNowReading />
          </SourceContent>
        </Card>
        <Card title="Currents" to="/currents">
          <SourceContent source="weather" errorMessage="Currents unavailable">
            <CurrentsReading />
          </SourceContent>
        </Card>
        <SunMoonCard />
      </div>

      {/* What lighthouses and buoys are reporting right now */}
      <NearbyObservationsCard />

      <Card title="Today's tide" to="/tides" className="card--wide">
        <SourceContent
          source="tides"
          errorMessage="Tides unavailable"
          placeholder={<Skeleton height={240} />}
        >
          <TodaysTideCurve />
        </SourceContent>
      </Card>
    </div>
  );
}

// The hourly weather reading closest to now
function useWeatherNow() {
  const { weather } = useApp();
  return findClosestReading(weather);
}

function WindReading() {
  const now = useWeatherNow();
  const { units } = useApp();
  const direction = now?.windDirectionDeg != null ? degreesToCardinal(now.windDirectionDeg) : '';
  return (
    <Stat label="Now" value={`${direction} ${formatSpeed(now?.windSpeedKts, units)}`.trim()} />
  );
}

function WavesReading() {
  const now = useWeatherNow();
  const { units } = useApp();
  const swell =
    now?.swellHeightFt != null ? `Swell ${formatHeight(now.swellHeightFt, units)}` : undefined;
  return <Stat label="Height" value={formatHeight(now?.waveHeightFt, units)} detail={swell} />;
}

function VisibilityReading() {
  const now = useWeatherNow();
  const { units } = useApp();
  return <Stat label="Now" value={formatDistance(now?.visibilityKm, units)} />;
}

function TideNowReading() {
  const { tides, tideEvents, units } = useApp();
  const current = findClosestReading(tides);
  const nextHigh = getNextTideEvent(tideEvents, 'HIGH');
  const nextLow = getNextTideEvent(tideEvents, 'LOW');

  return (
    <>
      <Stat label="Now" value={formatHeight(current?.heightFt, units)} />
      <p className="card__note numeric">
        High {nextHigh ? formatTime(nextHigh.time) : NO_VALUE} · Low{' '}
        {nextLow ? formatTime(nextLow.time) : NO_VALUE}
      </p>
    </>
  );
}

function CurrentsReading() {
  const { weather, units } = useApp();
  const now = useWeatherNow();
  if (!hasCurrentData(weather))
    return <p className="card__note">No current data for this station.</p>;

  const phase = getCurrentPhase(weather);
  const phaseTone = { Flooding: 'safe', Ebbing: 'warning' }[phase] ?? 'muted';
  const direction =
    now?.currentDirectionDeg != null ? degreesToCardinal(now.currentDirectionDeg) : NO_VALUE;
  return (
    <>
      <Stat label="Speed" value={formatSpeed(now?.currentSpeedKts, units, 1)} detail={direction} />
      <p className={`card__note stat__value--${phaseTone}`}>{phase ?? NO_VALUE}</p>
    </>
  );
}

// Calculated on the device from the station's position, so it never waits for an API
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

function TodaysTideCurve() {
  const { tides, tideEvents, units } = useApp();
  return <TideCurve tides={tides} events={tideEvents} units={units} />;
}

function ForecastText() {
  const { marineForecast, activeStation } = useApp();
  return (
    <>
      <p className="forecast-text">{tidyForecastText(marineForecast.forecast) || NO_VALUE}</p>
      <p className="card__source">Source: Environment Canada · {activeStation.region}</p>
    </>
  );
}

function ForecastPlaceholder() {
  return (
    <>
      <span className="visually-hidden">Loading forecast…</span>
      <Skeleton height={14} />
      <Skeleton height={14} width="85%" />
      <Skeleton height={14} width="60%" />
    </>
  );
}
