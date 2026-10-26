import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import UnitsPicker from './UnitsPicker.jsx';

// Settings button in the header that drops down a small panel (units for now)
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
          <h2 className="sidebar__label">Units</h2>
          <UnitsPicker />
          <p className="settings-menu__note">Saved on this device until you change it.</p>
        </section>
      )}
    </div>
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
