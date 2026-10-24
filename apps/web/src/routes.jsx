import { Routes, Route } from 'react-router';
import AppShell from './layout/AppShell.jsx';

// Temporary page placeholder — Tasks 11–12 replace these with the real views
function PagePlaceholder({ title }) {
  return <h2>{title}</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<PagePlaceholder title="Dashboard" />} />
        <Route path="tides" element={<PagePlaceholder title="Tides" />} />
        <Route path="weather" element={<PagePlaceholder title="Weather" />} />
        <Route path="currents" element={<PagePlaceholder title="Currents" />} />
      </Route>
    </Routes>
  );
}
