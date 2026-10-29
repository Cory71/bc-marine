import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  BC_REGIONS,
  ALL_LOCATIONS,
  OBSERVATION_SITES,
  findNearestStation,
  isRoughLocation,
  searchPlaceNames,
  toStationSlug,
} from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import { useSavedSites } from '../context/useSavedSites.js';
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
          <SavedSites onPick={onClose} />
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
      <span className="visually-hidden">Search places, harbours and weather areas</span>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search places, harbours & areas"
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

  const sites = OBSERVATION_SITES.filter(site => site.name.toLowerCase().includes(text));
  const places = usePlaceNameSearch(query.trim());
  const nothingFound = results.length === 0 && sites.length === 0 && places.length === 0;

  return (
    <section className="sidebar__section" aria-label="Search results">
      <h2 className="sidebar__label">Search results</h2>
      {nothingFound && <p className="sidebar__empty">Nothing found.</p>}
      <StationList stations={results} onSelect={onSelect} showRegion />
      <SiteResults sites={sites} onPick={onPickSite} />
      <PlaceNameResults places={places} onSelect={onSelect} />
    </section>
  );
}

// Any other BC place name (Deep Bay, Fanny Bay…), from BC Geographical Names,
// each leading to its nearest station
function PlaceNameResults({ places, onSelect }) {
  if (places.length === 0) return null;

  return (
    <>
      <h2 className="sidebar__label sidebar__label--spaced">Other places</h2>
      <ul className="station-list">
        {places.map(place => (
          <li key={`${place.name}|${place.station.name}`}>
            <button
              type="button"
              className="station-button station-button--stacked"
              onClick={() => onSelect(place.station)}
            >
              <span>
                {place.name} · {place.kind}
              </span>
              <span className="station-button__region">
                Nearest station: {place.station.name}, {Math.round(place.distanceKm)} km
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// Look up place names once typing pauses; searches under 3 letters are too vague.
// An older answer that arrives after a newer search is ignored.
const MIN_PLACE_SEARCH_LENGTH = 3;
const TYPING_PAUSE_MS = 300;

function usePlaceNameSearch(query) {
  const [results, setResults] = useState({ query: '', places: [] });

  useEffect(() => {
    if (query.length < MIN_PLACE_SEARCH_LENGTH) return undefined;
    let isCurrent = true;
    const timer = setTimeout(() => {
      searchPlaceNames(query)
        .then(places => isCurrent && setResults({ query, places }))
        .catch(() => isCurrent && setResults({ query, places: [] })); // offline: stations still work
    }, TYPING_PAUSE_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query]);

  return results.query === query ? results.places : [];
}

// Lighthouses and buoys matching the search, linking to their own pages
function SiteResults({ sites, onPick }) {
  const { search } = useLocation();
  if (sites.length === 0) return null;

  return (
    <>
      <h2 className="sidebar__label sidebar__label--spaced">Lighthouses &amp; buoys</h2>
      <ul className="station-list">
        {sites.map(site => (
          <li key={site.id}>
            <SiteLink site={site} search={search} onPick={onPick} />
          </li>
        ))}
      </ul>
    </>
  );
}

// Lighthouses and buoys starred on their own pages, each with a remove button
function SavedSites({ onPick }) {
  const { search } = useLocation();
  const { savedSites, removeSavedSite } = useSavedSites();
  if (savedSites.length === 0) return null;

  return (
    <section className="sidebar__section" aria-labelledby="saved-sites-heading">
      <h2 id="saved-sites-heading" className="sidebar__label">
        Saved lighthouses &amp; buoys
      </h2>
      <ul className="station-list">
        {savedSites.map(site => (
          <li key={site.id} className="station-list__row">
            <SiteLink site={site} search={search} onPick={onPick} />
            <button type="button" className="icon-button" onClick={() => removeSavedSite(site.id)}>
              <Icon name="close" size={14} />
              <span className="visually-hidden">Remove {site.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// A link to one site's page, keeping ?station= so the active station stays put
function SiteLink({ site, search, onPick }) {
  return (
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
  );
}

// Ask for the precise location (GPS where there is one), and don't reuse an old one
const LOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

// Finds the closest station using the browser's location (hidden if unsupported).
// A rough location (common on computers) is shown as a guess instead of jumping there.
function NearestStationButton({ onSelect }) {
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [roughGuess, setRoughGuess] = useState(null);
  if (!('geolocation' in navigator)) return null;

  function handlePosition(position) {
    setLocating(false);
    const { latitude, longitude, accuracy } = position.coords;
    const nearest = findNearestStation(latitude, longitude, ALL_LOCATIONS);
    if (isRoughLocation(accuracy)) setRoughGuess({ station: nearest, withinKm: accuracy / 1000 });
    else onSelect(nearest);
  }

  function handleClick() {
    setError('');
    setRoughGuess(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      () => {
        setLocating(false);
        setError('Location access is needed to find your nearest station.');
      },
      LOCATION_OPTIONS
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
      {roughGuess && <RoughLocationGuess guess={roughGuess} onSelect={onSelect} />}
    </div>
  );
}

// "Your device could only place you within about 40 km, near White Rock."
function RoughLocationGuess({ guess, onSelect }) {
  const { station, withinKm } = guess;
  return (
    <div className="sidebar__note" role="status">
      <p>
        Your device could only place you within about {Math.round(withinKm)} km, near {station.name}
        . If that&apos;s wrong, pick your station below.
      </p>
      <button type="button" className="button button--wide" onClick={() => onSelect(station)}>
        Use {station.name}
      </button>
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
