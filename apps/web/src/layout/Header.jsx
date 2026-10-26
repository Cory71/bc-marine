import { NavLink, useLocation } from 'react-router';
import { timeSince } from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import WarningBanner from '../components/WarningBanner.jsx';
import Icon from '../components/Icon.jsx';
import SettingsMenu from '../components/SettingsMenu.jsx';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Tides', path: '/tides' },
  { label: 'Weather', path: '/weather' },
  { label: 'Currents', path: '/currents' },
  { label: 'Observations', path: '/observations' },
];

export default function Header({ onOpenDrawer, menuButtonRef, drawerOpen }) {
  const { activeStation, marineForecast, lastUpdated, loading, refresh } = useApp();

  return (
    <header className="header">
      <div className="header__top">
        <button
          ref={menuButtonRef}
          type="button"
          className="button header__menu"
          onClick={onOpenDrawer}
          aria-controls="station-sidebar"
          aria-expanded={drawerOpen}
        >
          <Icon name="menu" />
          Change station
        </button>

        <div className="header__station">
          <h1 className="header__name">{activeStation.name}</h1>
          <p className="header__region">
            {activeStation.region} · {activeStation.coast}
          </p>
        </div>

        <div className="header__status">
          <span className="header__updated" aria-live="polite">
            {loading ? 'Loading…' : lastUpdated && timeSince(lastUpdated)}
          </span>
          <button type="button" className="button" onClick={refresh} disabled={loading}>
            <Icon name="refresh" />
            Refresh
          </button>
          <SettingsMenu />
        </div>
      </div>

      <WarningBanner warnings={marineForecast.warnings} />
      <MainNav />
    </header>
  );
}

// Page tabs — each link keeps the ?station= so the station stays the same
function MainNav() {
  const { search } = useLocation();
  return (
    <nav className="main-nav" aria-label="Views">
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.path}
          to={{ pathname: item.path, search }}
          end={item.path === '/'} // '/' would otherwise match every page
          className="main-nav__link"
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
