import { Link, useLocation } from 'react-router';
import Icon from './Icon.jsx';

// A dashboard panel. With `to`, the whole card links to a detail view
// (keeping ?station=); otherwise it's a plain section.
export default function Card({ title, to, className = '', children }) {
  const { search } = useLocation();
  const classes = `card ${to ? 'card--link' : ''} ${className}`;
  const heading = (
    <h2 className="card__title">
      {title}
      {to && <Icon name="chevron" size={14} />}
    </h2>
  );

  if (to) {
    return (
      <Link to={{ pathname: to, search }} className={classes}>
        {heading}
        {children}
      </Link>
    );
  }
  return (
    <section className={classes}>
      {heading}
      {children}
    </section>
  );
}
