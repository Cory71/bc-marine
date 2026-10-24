import {
  findClosestReading,
  getNextTideEvent,
  getTideTrend,
  getRecentAndUpcomingEvents,
  formatTime,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import DetailPage, { EmptyState } from '../components/DetailPage.jsx';
import Card from '../components/Card.jsx';
import Stat from '../components/Stat.jsx';
import TideCurve from '../components/TideCurve.jsx';
import WeeklyTideBars from '../components/WeeklyTideBars.jsx';
import PanelError from '../components/PanelError.jsx';

export default function TidesPage() {
  return (
    <DetailPage title="Tides" source="Fisheries and Oceans Canada">
      <TidesContent />
    </DetailPage>
  );
}

function TidesContent() {
  const { tides, tideEvents, weeklyTides, failures } = useApp();

  if (tides.length === 0) {
    return failures.includes('tides') ? (
      <PanelError message="Tides unavailable. Try refreshing." />
    ) : (
      <EmptyState message="No tide data available for this station." />
    );
  }

  const current = findClosestReading(tides);
  const trend = getTideTrend(tides);
  const nextEvent = getNextTideEvent(tideEvents);

  return (
    <>
      <Card title="Now">
        <div className="stat-row stat-row--spread">
          <Stat label="Current height" value={`${current?.heightFt ?? '--'} ft`} detail={trend} />
          <Stat
            label="Next event"
            value={nextEvent ? `${capitalize(nextEvent.type)} ${nextEvent.heightFt} ft` : '--'}
            detail={nextEvent && formatTime(nextEvent.time)}
          />
        </div>
      </Card>
      <Card title="Today's tide">
        <TideCurve tides={tides} events={tideEvents} height={280} />
      </Card>
      <div className="detail__columns">
        <Card title="Highs and lows">
          <TideEventsTable events={tideEvents} />
        </Card>
        <Card title="Highest tide, next 7 days">
          {weeklyTides.length > 0 ? (
            <WeeklyTideBars days={weeklyTides} />
          ) : (
            <p className="card__note">Weekly tides unavailable.</p>
          )}
        </Card>
      </div>
    </>
  );
}

// Events from an hour ago onward, so a tide that just turned is still listed (like mobile)
function TideEventsTable({ events }) {
  const recentAndUpcoming = getRecentAndUpcomingEvents(events);
  if (recentAndUpcoming.length === 0) return <p className="card__note">No upcoming events.</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Tide</th>
          <th scope="col">Height</th>
          <th scope="col">Time</th>
        </tr>
      </thead>
      <tbody>
        {recentAndUpcoming.map(event => (
          <tr key={event.time.toString()}>
            <th scope="row" className={event.type === 'HIGH' ? 'tide-type--high' : 'tide-type--low'}>
              {event.type === 'HIGH' ? '↑ High' : '↓ Low'}
            </th>
            <td>{event.heightFt} ft</td>
            <td>{formatTime(event.time)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 'HIGH' → 'High'
function capitalize(word) {
  return word.charAt(0) + word.slice(1).toLowerCase();
}
