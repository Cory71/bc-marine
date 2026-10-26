import { UNIT_OPTIONS } from '@bc-marine/shared';
import { useApp } from '../context/AppContext.jsx';

const KIND_LABELS = {
  speed: 'Speed',
  height: 'Height',
  temperature: 'Temperature',
  distance: 'Distance',
};

// A row of toggle buttons for each kind of unit; the choice is saved on this device
export default function UnitsPicker() {
  const { units, setUnit } = useApp();

  return (
    <div className="units-picker">
      {Object.entries(UNIT_OPTIONS).map(([kind, options]) => (
        <div key={kind} role="group" aria-label={KIND_LABELS[kind]} className="units-picker__row">
          <span className="units-picker__label">{KIND_LABELS[kind]}</span>
          <div className="units-picker__options">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                className="units-picker__option"
                aria-pressed={units[kind] === option.value}
                onClick={() => setUnit(kind, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
