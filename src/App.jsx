import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
import { TelemetryConfigProvider } from './context/TelemetryConfigContext';

// Lazy-loaded pages: each becomes its own chunk and only downloads
// when the user navigates to the corresponding route. See docs/code-splitting.md.
const PitwallPage = lazy(() =>
  import('./pages/PitwallPage').then(m => ({ default: m.PitwallPage }))
);
const DynamicsPage = lazy(() =>
  import('./pages/DynamicPage').then(m => ({ default: m.DynamicsPage }))
);
const PowertrainPage = lazy(() =>
  import('./pages/PowertrainPage').then(m => ({ default: m.PowertrainPage }))
);
const BatteryPage = lazy(() =>
  import('./pages/BatteryPage').then(m => ({ default: m.BatteryPage }))
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);

const RouteFallback = () => (
  <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
);

function App() {
  // Nested component (HOC) when working it should be viewed in reverse order
  /**
   * Routes -> Pure React-router-dom, acts like aref in HTML, it route to specific path, and apply React component (Page)
   * MainLayout -> The Sidebar Menu , the Site Header, setting and theme button
   * BrowserRouter -> Deal with Client side routing
   * SessionProvider -> Takes the Browser Route  Output:
   * ThemeProvider -> Apply to Output: the CSS coloring
   */
  return (
    <ThemeProvider>
      <TelemetryConfigProvider>
      <SessionProvider>
        <BrowserRouter>
          <MainLayout>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<PitwallPage />} />
                <Route path="/dynamics" element={<DynamicsPage />} />
                <Route path="/powertrain" element={<PowertrainPage />} />
                <Route path="/battery" element={<BatteryPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </BrowserRouter>
      </SessionProvider>
      </TelemetryConfigProvider>
    </ThemeProvider>
  );
}

export default App;
