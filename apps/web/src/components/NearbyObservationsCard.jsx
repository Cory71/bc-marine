import { summarizeObservation, formatReadingAge, isOldReading } from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import Card from './Card.jsx';
import SourceContent from './SourceContent.jsx';

// Dashboard card: a quick line per nearby lighthouse or buoy. The whole card
// opens the Observations page with every value each site reports.
export default function NearbyObservationsCard() {
  return (
    <Card title="Nearby observations" to="/observations" className="card--wide">
      <SourceContent source="observations" errorMessage="Observations unavailable">
        <ObservationLines />
      </SourceContent>
    </Card>
  );
}

function ObservationLines() {
  const { observations } = useApp();
  if (observations.length === 0) return <p className="card__note">No observation sites nearby.</p>;

  return (
    <ul className="obs-lines">
      {observations.map(observation => (
        <ObservationLine key={observation.site.id} observation={observation} />
      ))}
    </ul>
  );
}

// One site's line. Readings older than 3 hours are faded and labelled, so they
// never pass for current conditions.
function ObservationLine({ observation }) {
  const { site, reading } = observation;
  const isOld = reading && isOldReading(reading.observedAt);

  return (
    <li className={`obs-lines__row ${isOld ? 'obs-lines__row--old' : ''}`}>
      <span className="obs-lines__name">{site.name}</span>
      <span className="numeric">{summarizeObservation(observation)}</span>
      {reading && (
        <span className="card__note">
          {isOld && <span className="obs-tile__old">Old reading · </span>}
          {formatReadingAge(reading.observedAt)}
        </span>
      )}
    </li>
  );
}
