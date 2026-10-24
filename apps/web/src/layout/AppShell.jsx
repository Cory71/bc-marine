import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

// Page frame: station sidebar (a drawer on small screens), header and the current view
export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // While the drawer is open: Esc closes it, and focus moves to the search box
  useEffect(() => {
    if (!drawerOpen) return;
    searchInputRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchInputRef={searchInputRef}
      />
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="app-shell__content">
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <main id="main-content" className="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
