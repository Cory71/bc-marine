import { useApp } from '../context/AppContext.jsx';
import Skeleton from './Skeleton.jsx';
import PanelError from './PanelError.jsx';

// Shows one data source's content once it has loaded: a placeholder while it
// loads, an inline error if it failed. Children only render when it's ready.
export default function SourceContent({ source, errorMessage, placeholder, children }) {
  const { getSourceStatus } = useApp();
  const status = getSourceStatus(source);

  if (status === 'loading') return placeholder ?? <DefaultPlaceholder />;
  if (status === 'failed') return <PanelError message={errorMessage} />;
  return children;
}

// Label-sized line and a value-sized line, roughly the shape of a reading
function DefaultPlaceholder() {
  return (
    <>
      <span className="visually-hidden">Loading…</span>
      <Skeleton width="40%" height={12} />
      <Skeleton width="65%" height={28} />
    </>
  );
}
