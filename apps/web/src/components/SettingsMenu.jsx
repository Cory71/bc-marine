import { useEffect, useRef, useState } from 'react';
import { THEME_OPTIONS } from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';
import UnitsPicker from './UnitsPicker.jsx';

// Settings button in the header that drops down a small panel
export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useCloseOnOutsideOrEscape(open, menuRef, () => setOpen(false));

  return (
    <div className="settings-menu" ref={menuRef}>
      <button
        type="button"
        className="button"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={() => setOpen(previous => !previous)}
      >
        <Icon name="settings" />
        Settings
      </button>
      {open && (
        <section id="settings-panel" className="settings-menu__panel" aria-label="Settings">
          <OpeningStationSetting />
          <ThemeSetting />
          <h2 className="sidebar__label settings-menu__heading">Units</h2>
          <UnitsPicker />
          <p className="settings-menu__note">
            Settings are saved on this device until you change them.
          </p>
        </section>
      )}
    </div>
  );
}

// Which station the app opens with, and a button to switch it to the one being viewed
function OpeningStationSetting() {
  const { activeStation, openingStation, setOpeningStation } = useApp();
  const isViewingOpeningStation = activeStation.name === openingStation.name;

  return (
    <>
      <h2 className="sidebar__label">Opening station</h2>
      <p className="settings-menu__opening">
        Opens with <strong>{openingStation.name}</strong>
      </p>
      {!isViewingOpeningStation && (
        <button
          type="button"
          className="button button--wide"
          onClick={() => setOpeningStation(activeStation)}
        >
          Open with {activeStation.name}
        </button>
      )}
    </>
  );
}

// Device / Light / Dark buttons, styled like the unit buttons
function ThemeSetting() {
  const { theme, setTheme } = useApp();

  return (
    <>
      <h2 className="sidebar__label settings-menu__heading">Theme</h2>
      <div role="group" aria-label="Theme" className="units-picker__options">
        {THEME_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            className="units-picker__option settings-menu__theme-option"
            aria-pressed={theme === option.value}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="settings-menu__note">Device follows your computer or phone.</p>
    </>
  );
}

// Close the panel on a click outside it or the Escape key
function useCloseOnOutsideOrEscape(open, containerRef, close) {
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current.contains(event.target)) close();
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, containerRef, close]);
}
