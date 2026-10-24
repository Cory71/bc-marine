import { Routes, Route } from 'react-router';
import AppShell from './layout/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TidesPage from './pages/TidesPage.jsx';
import WeatherPage from './pages/WeatherPage.jsx';
import CurrentsPage from './pages/CurrentsPage.jsx';

// Every view sits inside the shell, so the sidebar and header stay put
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="tides" element={<TidesPage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="currents" element={<CurrentsPage />} />
        {/* Unknown paths show the dashboard rather than a blank page */}
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
