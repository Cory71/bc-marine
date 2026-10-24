import {
  findClosestReading,
  getCurrentPhase,
  getUpcomingHours,
  hasCurrentData,
  degreesToCompass,
  formatTime,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import DetailPage, { EmptyState } from '../components/DetailPage.jsx';
import Card from '../components/Card.jsx';
import Stat from '../components/Stat.jsx';
import PanelError from '../components/PanelError.jsx';

const PHASE_TONES = { Flooding: 'safe', Ebbing: 'warning' };

export default function CurrentsPage() {
  return (
    <DetailPage title="Tidal currents" source="Open-Meteo">
      <CurrentsContent />
    </DetailPage>
  );
}

function CurrentsContent() {
  const { weather, failures } = useApp();

  if (failures.includes('weather') && weather.length === 0) {
    return <PanelError message="Current data unavailable. Try refreshing." />;
  }
  // Open-Meteo has no current data for fjords, inlets and many sheltered waters
  if (!hasCurrentData(weather)) {
    return (
      <EmptyState
        message="No tidal current data available for this station."
        detail="Open-Meteo does not cover fjords, inlets, and many sheltered BC waters."
      />
    );
  }

  const now = findClosestReading(weather);
  const phase = getCurrentPhase(weather);
  return (
    <>
      <Card title="Now">
        <div className="stat-row">
          <Stat label="Speed" value={`${now?.currentSpeedKts?.toFixed(1) ?? '--'} kts`} />
          <Stat label="Direction" value={degreesToCompass(now?.currentDirectionDeg)} />
          <Stat label="Phase" value={phase ?? '--'} tone={PHASE_TONES[phase] ?? 'muted'} />
        </div>
      </Card>
      <Card title="Next 8 hours">
        <HourlyCurrentsTable hours={getUpcomingHours(weather)} />
      </Card>
    </>
  );
}

function HourlyCurrentsTable({ hours }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Speed</th>
            <th scope="col">Direction</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((hour, i) => (
            <tr key={hour.time.toString()} className={i === 0 ? 'data-table__now' : ''}>
              <th scope="row">{i === 0 ? 'Now' : formatTime(hour.time)}</th>
              <td>{hour.currentSpeedKts?.toFixed(1) ?? '--'} kts</td>
              <td>{degreesToCompass(hour.currentDirectionDeg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
