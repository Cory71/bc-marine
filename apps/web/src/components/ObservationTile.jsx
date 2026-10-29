import {
  formatWind,
  formatGust,
  formatWaves,
  formatWavePeriod,
  formatPressure,
  formatTemp,
  formatDistance,
  formatReadingAge,
  isOldReading,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';

const TYPE_LABELS = { lighthouse: 'Lighthouse', buoy: 'Buoy' };

// One lighthouse or buoy: name, type, distance, how fresh the reading is, then
// every value the site reports (values it doesn't report are left out)
export default function ObservationTile({ site, distanceKm, reading }) {
  const { units } = useApp();
  const isOld = reading && isOldReading(reading.observedAt);

  return (
    <article className={`obs-tile ${isOld ? 'obs-tile--old' : ''}`}>
      <div className="obs-tile__top">
        <h3 className="obs-tile__name">{site.name}</h3>
        <span className={`obs-badge obs-badge--${site.type}`}>{TYPE_LABELS[site.type]}</span>
      </div>
      <p className="card__note numeric">
        {formatDistance(distanceKm, units)}
        {reading && ` · ${formatReadingAge(reading.observedAt)}`}
        {isOld && (
          <>
            {' · '}
            <span className="obs-tile__old">Old reading</span>
          </>
        )}
      </p>
      {reading ? (
        <ReadingStats reading={reading} units={units} />
      ) : (
        <p className="card__note">No recent report</p>
      )}
    </article>
  );
}

// Label and value pairs, skipping anything the site didn't report
export function ReadingStats({ reading, units }) {
  const stats = [
    ['Wind', reading.windKts, formatWind(reading, units)],
    ['Gust (1 h)', reading.gustKts, formatGust(reading, units)],
    ['Waves', reading.waveHeightFt, formatWaves(reading, units)],
    ['Period', reading.wavePeriodS, formatWavePeriod(reading)],
    ['Water', reading.waterTempC, formatTemp(reading.waterTempC, units)],
    ['Pressure', reading.pressureHpa, formatPressure(reading, units)],
    ['Air', reading.airTempC, formatTemp(reading.airTempC, units)],
  ].filter(([, rawValue]) => rawValue != null);

  return (
    <dl className="obs-tile__stats">
      {stats.map(([label, , text]) => (
        <div key={label}>
          <dt className="stat__label">{label}</dt>
          <dd className="obs-tile__value numeric">{text}</dd>
        </div>
      ))}
    </dl>
  );
}
