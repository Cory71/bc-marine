import { Routes, Route, Outlet } from 'react-router';
import { useApp } from './context/AppContext.jsx';

// Temporary shell and pages — Tasks 10–12 replace these with the real layout and views
function AppShellStub() {
  const { activeStation, loading } = useApp();
  return (
    <main className="placeholder">
      <h1>BC Marine</h1>
      <p>
        {activeStation.name} {loading ? '· loading…' : ''}
      </p>
      <Outlet />
    </main>
  );
}

function PagePlaceholder({ title }) {
  return <h2>{title}</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShellStub />}>
        <Route index element={<PagePlaceholder title="Dashboard" />} />
        <Route path="tides" element={<PagePlaceholder title="Tides" />} />
        <Route path="weather" element={<PagePlaceholder title="Weather" />} />
        <Route path="currents" element={<PagePlaceholder title="Currents" />} />
      </Route>
    </Routes>
  );
}
