import { Link, useLocation } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';
import Skeleton from './Skeleton.jsx';

// Frame for the tides, weather and currents views: back link, title and data source
export default function DetailPage({ title, source, children }) {
  const { search } = useLocation();
  const { activeStation, loading, lastUpdated } = useApp();
  const isFirstLoad = loading && !lastUpdated;

  return (
    <div className={`detail ${loading && !isFirstLoad ? 'is-refreshing' : ''}`} aria-busy={loading}>
      <Link to={{ pathname: '/', search }} className="back-link">
        <Icon name="chevron" size={14} />
        Back to dashboard
      </Link>
      <div>
        <h2 className="detail__title">{title}</h2>
        <p className="detail__source">
          {activeStation.name} · {source}
        </p>
      </div>
      {isFirstLoad ? <DetailSkeleton /> : children}
    </div>
  );
}

// Friendly message when a source has nothing for this station
export function EmptyState({ message, detail }) {
  return (
    <div className="card empty-state">
      <p className="empty-state__message">{message}</p>
      {detail && <p className="card__note">{detail}</p>}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <p className="visually-hidden">Loading…</p>
      <div className="card">
        <Skeleton width="30%" height={12} />
        <Skeleton width="50%" height={28} />
      </div>
      <div className="card">
        <Skeleton height={200} />
      </div>
    </>
  );
}
