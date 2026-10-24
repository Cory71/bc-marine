import {
  findClosestReading,
  getUpcomingHours,
  degreesToCompass,
  formatTime,
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
  const { weather } = useApp();
  if (weather.length === 0)
    return <EmptyState message="No weather data available for this station." />;

  const now = findClosestReading(weather);
  return (
    <>
      <Card title="Current conditions">
        <div className="stat-row stat-row--spread">
          <Stat label="Wind" value={formatWind(now)} />
          <Stat
            label="Waves"
            value={`${now?.waveHeightFt ?? NO_VALUE} ft`}
            detail={`${now?.wavePeriodS?.toFixed(0) ?? NO_VALUE} s period`}
          />
          <Stat
            label="Swell"
            value={`${now?.swellHeightFt ?? NO_VALUE} ft`}
            detail={degreesToCompass(now?.swellDirectionDeg)}
          />
          <Stat label="Visibility" value={formatVisibility(now)} />
        </div>
      </Card>
      <Card title="Next 8 hours">
        <HourlyWeatherTable hours={getUpcomingHours(weather)} />
      </Card>
    </>
  );
}

// e.g. "SSE 12 kts"
function formatWind(hour) {
  const speed = hour?.windSpeedKts != null ? Math.round(hour.windSpeedKts) : NO_VALUE;
  return `${degreesToCompass(hour?.windDirectionDeg)} ${speed} kts`;
}

function formatVisibility(hour) {
  return `${hour?.visibilityKm != null ? Math.round(hour.visibilityKm) : NO_VALUE} km`;
}

function HourlyWeatherTable({ hours }) {
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
              <td>{formatWind(hour)}</td>
              <td>{hour.waveHeightFt ?? NO_VALUE} ft</td>
              <td>
                {hour.swellHeightFt ?? NO_VALUE} ft {degreesToCompass(hour.swellDirectionDeg)}
              </td>
              <td>{formatVisibility(hour)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
