import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { PitwallPage } from './pages/PitwallPage';
import { DynamicsPage } from './pages/DynamicPage';
import { PowertrainPage } from './pages/PowertrainPage';
import { BatteryPage } from './pages/BatteryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
import { TelemetryConfigProvider } from './context/TelemetryConfigContext';

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
            <Routes>
              <Route path="/" element={<PitwallPage />} />
              <Route path="/dynamics" element={<DynamicsPage />} />
              <Route path="/powertrain" element={<PowertrainPage />} />
              <Route path="/battery" element={<BatteryPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </SessionProvider>
      </TelemetryConfigProvider>
    </ThemeProvider>
  );
}

export default App;
