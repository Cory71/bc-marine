import { summarizeObservation, formatReadingAge } from '@bc-marine/shared';
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
        <li key={observation.site.id} className="obs-lines__row">
          <span className="obs-lines__name">{observation.site.name}</span>
          <span className="numeric">{summarizeObservation(observation)}</span>
          {observation.reading && (
            <span className="card__note">{formatReadingAge(observation.reading.observedAt)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
