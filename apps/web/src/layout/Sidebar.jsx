import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  BC_REGIONS,
  ALL_LOCATIONS,
  OBSERVATION_SITES,
  findNearestStation,
  toStationSlug,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import Icon from '../components/Icon.jsx';

// Station picker: search, nearest station, saved stations and the full region list
export default function Sidebar({ open, onClose, searchInputRef }) {
  const { setActiveStationBySlug, saveStation } = useApp();
  const [query, setQuery] = useState('');

  // Clear the search and close the drawer (after picking a lighthouse or buoy)
  function finishSearch() {
    setQuery('');
    onClose();
  }

  // Selecting a station also saves it (same as the mobile app)
  function selectStation(station) {
    setActiveStationBySlug(toStationSlug(station.name));
    saveStation(station);
    setQuery('');
    onClose();
  }

  return (
    <aside
      id="station-sidebar"
      className={`sidebar ${open ? 'sidebar--open' : ''}`}
      aria-label="Stations"
    >
      <div className="sidebar__top">
        <p className="sidebar__brand">BC Marine</p>
        <button type="button" className="icon-button sidebar__close" onClick={onClose}>
          <Icon name="close" />
          <span className="visually-hidden">Close station list</span>
        </button>
      </div>

      <StationSearch query={query} onQueryChange={setQuery} inputRef={searchInputRef} />
      {query ? (
        <SearchResults query={query} onSelect={selectStation} onPickSite={finishSearch} />
      ) : (
        <>
          <NearestStationButton onSelect={selectStation} />
          <SavedStations onSelect={selectStation} />
          <RegionList onSelect={selectStation} />
        </>
      )}
    </aside>
  );
}

function StationSearch({ query, onQueryChange, inputRef }) {
  return (
    <label className="search">
      <Icon name="search" />
      <span className="visually-hidden">Search stations and weather areas</span>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search stations & areas"
        value={query}
        onChange={event => onQueryChange(event.target.value)}
      />
    </label>
  );
}

// Case-insensitive match on station name or weather area, like the mobile app
function SearchResults({ query, onSelect, onPickSite }) {
  const text = query.toLowerCase();
  const results = ALL_LOCATIONS.filter(
    location =>
      location.name.toLowerCase().includes(text) || location.region.toLowerCase().includes(text)
  );

  return (
    <section className="sidebar__section" aria-label="Search results">
      <h2 className="sidebar__label">Search results</h2>
      {results.length === 0 && <p className="sidebar__empty">No stations found.</p>}
      <StationList stations={results} onSelect={onSelect} showRegion />
      <SiteResults text={text} onPick={onPickSite} />
    </section>
  );
}

// Lighthouses and buoys matching the search, linking to their own pages
function SiteResults({ text, onPick }) {
  const { search } = useLocation();
  const sites = OBSERVATION_SITES.filter(site => site.name.toLowerCase().includes(text));
  if (sites.length === 0) return null;

  return (
    <>
      <h2 className="sidebar__label sidebar__label--spaced">Lighthouses &amp; buoys</h2>
      <ul className="station-list">
        {sites.map(site => (
          <li key={site.id}>
            <Link
              to={{ pathname: `/observations/${site.id}`, search }}
              className="station-button"
              onClick={onPick}
            >
              <span>{site.name}</span>
              <span className={`obs-badge obs-badge--${site.type}`}>
                {site.type === 'buoy' ? 'Buoy' : 'Lighthouse'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// Finds the closest station using the browser's location (hidden if unsupported)
function NearestStationButton({ onSelect }) {
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  if (!('geolocation' in navigator)) return null;

  function handleClick() {
    setError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        onSelect(findNearestStation(latitude, longitude, ALL_LOCATIONS));
      },
      () => {
        setLocating(false);
        setError('Location access is needed to find your nearest station.');
      }
    );
  }

  return (
    <div className="sidebar__section">
      <button
        type="button"
        className="button button--wide"
        onClick={handleClick}
        disabled={locating}
      >
        <Icon name="location" />
        {locating ? 'Finding your location…' : 'Use my location'}
      </button>
      {error && <p className="sidebar__error">{error}</p>}
    </div>
  );
}

function SavedStations({ onSelect }) {
  const { savedStations, removeStation } = useApp();
  if (savedStations.length === 0) return null;

  return (
    <section className="sidebar__section" aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="sidebar__label">
        Saved
      </h2>
      <ul className="station-list">
        {savedStations.map(station => {
          const slug = toStationSlug(station.name);
          return (
            <li key={slug} className="station-list__row">
              <StationButton station={station} onSelect={onSelect} />
              <button type="button" className="icon-button" onClick={() => removeStation(slug)}>
                <Icon name="close" size={14} />
                <span className="visually-hidden">Remove {station.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Coasts → EC weather areas → stations; coasts open and close
function RegionList({ onSelect }) {
  const { activeStation } = useApp();
  // Start with the active station's coast open so it's easy to find
  const [openCoasts, setOpenCoasts] = useState(() => new Set([activeStation.coast]));

  function toggleCoast(coastName) {
    setOpenCoasts(previous => {
      const next = new Set(previous);
      if (next.has(coastName)) next.delete(coastName);
      else next.add(coastName);
      return next;
    });
  }

  return (
    <section className="sidebar__section" aria-labelledby="regions-heading">
      <h2 id="regions-heading" className="sidebar__label">
        All regions
      </h2>
      {BC_REGIONS.map(coast => {
        const isOpen = openCoasts.has(coast.name);
        const panelId = `coast-${toStationSlug(coast.name)}`;
        return (
          <div key={coast.name} className="coast">
            <button
              type="button"
              className="coast__toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleCoast(coast.name)}
            >
              <Icon name="chevron" size={14} />
              {coast.name}
            </button>
            {isOpen && (
              <div id={panelId}>
                {coast.areas.map(area => (
                  <div key={area.name} className="area">
                    <h3 className="area__name">{area.name}</h3>
                    <StationList stations={area.stations} onSelect={onSelect} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function StationList({ stations, onSelect, showRegion = false }) {
  return (
    <ul className="station-list">
      {stations.map(station => (
        <li key={toStationSlug(station.name)}>
          <StationButton station={station} onSelect={onSelect} showRegion={showRegion} />
        </li>
      ))}
    </ul>
  );
}

// One station row; the active station is highlighted and announced as current
function StationButton({ station, onSelect, showRegion = false }) {
  const { activeStation } = useApp();
  const isActive = activeStation.name === station.name;

  return (
    <button
      type="button"
      className="station-button"
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(station)}
    >
      <span>{station.name}</span>
      {showRegion && <span className="station-button__region">{station.region}</span>}
    </button>
  );
}
