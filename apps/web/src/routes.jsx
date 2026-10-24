import { Routes, Route } from 'react-router';
import AppShell from './layout/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

// Temporary page placeholder — Task 12 replaces these with the real views
function PagePlaceholder({ title }) {
  return <h2>{title}</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="tides" element={<PagePlaceholder title="Tides" />} />
        <Route path="weather" element={<PagePlaceholder title="Weather" />} />
        <Route path="currents" element={<PagePlaceholder title="Currents" />} />
      </Route>
    </Routes>
  );
}
