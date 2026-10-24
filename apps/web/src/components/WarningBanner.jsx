import Icon from './Icon.jsx';

// Shows the first active EC warning, plus a count if there are more
export default function WarningBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  const [first] = warnings;
  const moreCount = warnings.length - 1;

  return (
    <div className="warning-banner" role="alert">
      <Icon name="warning" />
      <div>
        <p className="warning-banner__title">
          {first.title}
          {moreCount > 0 && <span className="warning-banner__more"> +{moreCount} more</span>}
        </p>
        <p className="warning-banner__body">{first.summary}</p>
      </div>
    </div>
  );
}
