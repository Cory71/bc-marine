import {
  findClosestReading,
  getNextTideEvent,
  getTideTrend,
  getRecentAndUpcomingEvents,
  formatTime,
  formatHeight,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import DetailPage, { EmptyState, DetailPlaceholder } from '../components/DetailPage.jsx';
import Card from '../components/Card.jsx';
import Stat from '../components/Stat.jsx';
import TideCurve from '../components/TideCurve.jsx';
import WeeklyTideBars from '../components/WeeklyTideBars.jsx';
import Skeleton from '../components/Skeleton.jsx';
import SourceContent from '../components/SourceContent.jsx';

export default function TidesPage() {
  return (
    <DetailPage title="Tides" source="Fisheries and Oceans Canada">
      <SourceContent
        source="tides"
        errorMessage="Tides unavailable. Try refreshing."
        placeholder={<DetailPlaceholder />}
      >
        <TidesContent />
      </SourceContent>
    </DetailPage>
  );
}

function TidesContent() {
  const { tides, tideEvents, units } = useApp();
  if (tides.length === 0) return <EmptyState message="No tide data available for this station." />;

  const current = findClosestReading(tides);
  const trend = getTideTrend(tides);
  const nextEvent = getNextTideEvent(tideEvents);

  return (
    <>
      <Card title="Now">
        <div className="stat-row stat-row--spread">
          <Stat
            label="Current height"
            value={formatHeight(current?.heightFt, units)}
            detail={trend}
          />
          <Stat
            label="Next event"
            value={
              nextEvent
                ? `${capitalize(nextEvent.type)} ${formatHeight(nextEvent.heightFt, units)}`
                : '--'
            }
            detail={nextEvent && formatTime(nextEvent.time)}
          />
        </div>
      </Card>
      <Card title="Today's tide">
        <TideCurve tides={tides} events={tideEvents} height={280} units={units} />
      </Card>
      <div className="detail__columns">
        <Card title="Highs and lows">
          <TideEventsTable events={tideEvents} />
        </Card>
        <Card title="Highest tide, next 7 days">
          {/* The 7-day chart needs 7 requests, so it loads on its own without holding up the page */}
          <SourceContent
            source="weeklyTides"
            errorMessage="Weekly tides unavailable."
            placeholder={<Skeleton height={200} />}
          >
            <WeeklyTides />
          </SourceContent>
        </Card>
      </div>
    </>
  );
}

function WeeklyTides() {
  const { weeklyTides, units } = useApp();
  return <WeeklyTideBars days={weeklyTides} units={units} />;
}

// Events from an hour ago onward, so a tide that just turned is still listed (like mobile)
function TideEventsTable({ events }) {
  const { units } = useApp();
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
            <th
              scope="row"
              className={event.type === 'HIGH' ? 'tide-type--high' : 'tide-type--low'}
            >
              {event.type === 'HIGH' ? '↑ High' : '↓ Low'}
            </th>
            <td>{formatHeight(event.heightFt, units)}</td>
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
