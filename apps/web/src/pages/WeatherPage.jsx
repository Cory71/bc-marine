import {
  findClosestReading,
  getUpcomingHours,
  degreesToCompass,
  formatTime,
  formatSpeed,
  formatHeight,
  formatDistance,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import DetailPage, { EmptyState, DetailPlaceholder } from '../components/DetailPage.jsx';
import Card from '../components/Card.jsx';
import Stat from '../components/Stat.jsx';
import SourceContent from '../components/SourceContent.jsx';

const NO_VALUE = '--';

export default function WeatherPage() {
  return (
    <DetailPage title="Wind & weather" source="Open-Meteo">
      <SourceContent
        source="weather"
        errorMessage="Weather unavailable. Try refreshing."
        placeholder={<DetailPlaceholder />}
      >
        <WeatherContent />
      </SourceContent>
    </DetailPage>
  );
}

function WeatherContent() {
  const { weather, units } = useApp();
  if (weather.length === 0)
    return <EmptyState message="No weather data available for this station." />;

  const now = findClosestReading(weather);
  return (
    <>
      <Card title="Current conditions">
        <div className="stat-row stat-row--spread">
          <Stat label="Wind" value={formatWind(now, units)} />
          <Stat
            label="Waves"
            value={formatHeight(now?.waveHeightFt, units)}
            detail={`${now?.wavePeriodS?.toFixed(0) ?? NO_VALUE} s period`}
          />
          <Stat
            label="Swell"
            value={formatHeight(now?.swellHeightFt, units)}
            detail={degreesToCompass(now?.swellDirectionDeg)}
          />
          <Stat label="Visibility" value={formatVisibility(now, units)} />
        </div>
      </Card>
      <Card title="Next 8 hours">
        <HourlyWeatherTable hours={getUpcomingHours(weather)} />
      </Card>
    </>
  );
}

// e.g. "SSE 12 kts" (or km/h / mph)
function formatWind(hour, units) {
  return `${degreesToCompass(hour?.windDirectionDeg)} ${formatSpeed(hour?.windSpeedKts, units)}`;
}

function formatVisibility(hour, units) {
  return formatDistance(hour?.visibilityKm, units);
}

function HourlyWeatherTable({ hours }) {
  const { units } = useApp();
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Wind</th>
            <th scope="col">Waves</th>
            <th scope="col">Swell</th>
            <th scope="col">Visibility</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((hour, i) => (
            <tr key={hour.time.toString()} className={i === 0 ? 'data-table__now' : ''}>
              <th scope="row">{i === 0 ? 'Now' : formatTime(hour.time)}</th>
              <td>{formatWind(hour, units)}</td>
              <td>{formatHeight(hour.waveHeightFt, units)}</td>
              <td>
                {formatHeight(hour.swellHeightFt, units)} {degreesToCompass(hour.swellDirectionDeg)}
              </td>
              <td>{formatVisibility(hour, units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
