// Highest tide for each of the next 7 days as simple CSS bars (today highlighted)
export default function WeeklyTideBars({ days }) {
  if (!days || days.length === 0) return null;
  const tallest = Math.max(...days.map(day => day.maxFt));

  return (
    <ol className="weekly-bars">
      {days.map((day, i) => (
        <li key={day.label} className={`weekly-bars__day ${i === 0 ? 'weekly-bars__day--today' : ''}`}>
          <span className="weekly-bars__value numeric">{day.maxFt} ft</span>
          <span className="weekly-bars__track">
            {/* Bar height is this day's max as a share of the week's tallest */}
            <span className="weekly-bars__bar" style={{ height: `${(day.maxFt / tallest) * 100}%` }} />
          </span>
          <span className="weekly-bars__label">{day.label}</span>
        </li>
      ))}
    </ol>
  );
}
