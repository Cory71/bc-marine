// Grey shimmering placeholder shown while the first data loads
export default function Skeleton({ height = 16, width = '100%' }) {
  return <span className="skeleton" style={{ height, width }} aria-hidden="true" />;
}
