import { useApp } from '../context/AppContext.jsx';
import DetailPage, { EmptyState, DetailPlaceholder } from '../components/DetailPage.jsx';
import SourceContent from '../components/SourceContent.jsx';
import ObservationTile from '../components/ObservationTile.jsx';

// Live readings from the lighthouses and buoys nearest the active station
export default function ObservationsPage() {
  return (
    <DetailPage title="Observations" source="Environment Canada, NOAA NDBC">
      <SourceContent
        source="observations"
        errorMessage="Observations unavailable. Try refreshing."
        placeholder={<DetailPlaceholder />}
      >
        <ObservationTiles />
      </SourceContent>
    </DetailPage>
  );
}

function ObservationTiles() {
  const { observations } = useApp();
  if (observations.length === 0) {
    return (
      <EmptyState
        message="No observation sites nearby."
        detail="There's no lighthouse weather station or buoy within 100 km of this station."
      />
    );
  }

  return (
    <div className="obs-grid">
      {observations.map(observation => (
        <ObservationTile key={observation.site.id} {...observation} />
      ))}
    </div>
  );
}
