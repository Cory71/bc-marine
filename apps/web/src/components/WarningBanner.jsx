import { sortWarningsBySeverity, isSevereWarning } from '@bc-marine/shared';
import Icon from './Icon.jsx';

// Shows the most severe active EC warning, plus a count if there are more.
// Gale and above use the red style; strong wind and other warnings stay amber.
export default function WarningBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  const [first] = sortWarningsBySeverity(warnings);
  const moreCount = warnings.length - 1;
  const severityClass = isSevereWarning(first.title) ? 'warning-banner--severe' : '';

  return (
    <div className={`warning-banner ${severityClass}`} role="alert">
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
