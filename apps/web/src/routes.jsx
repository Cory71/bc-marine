import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import AppShell from './layout/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { DetailPlaceholder } from './components/DetailPage.jsx';

// Detail views load on demand, so the first visit only downloads the dashboard
const TidesPage = lazy(() => import('./pages/TidesPage.jsx'));
const WeatherPage = lazy(() => import('./pages/WeatherPage.jsx'));
const CurrentsPage = lazy(() => import('./pages/CurrentsPage.jsx'));
const ObservationsPage = lazy(() => import('./pages/ObservationsPage.jsx'));
const SitePage = lazy(() => import('./pages/SitePage.jsx'));

// Every view sits inside the shell, so the sidebar and header stay put
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="tides" element={<LazyPage page={<TidesPage />} />} />
        <Route path="weather" element={<LazyPage page={<WeatherPage />} />} />
        <Route path="currents" element={<LazyPage page={<CurrentsPage />} />} />
        <Route path="observations" element={<LazyPage page={<ObservationsPage />} />} />
        <Route path="observations/:siteId" element={<LazyPage page={<SitePage />} />} />
        {/* Unknown paths show the dashboard rather than a blank page */}
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

// Shows a placeholder for the moment a detail view's code is downloading
function LazyPage({ page }) {
  return <Suspense fallback={<DetailPlaceholder />}>{page}</Suspense>;
}
