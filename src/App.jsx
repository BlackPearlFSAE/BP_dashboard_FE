import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { PitwallPage } from './pages/PitwallPage';
import { DynamicsPage } from './pages/DynamicPage';
import { PowertrainPage } from './pages/PowertrainPage';
import { BatteryPage } from './pages/BatteryPage';
import { HistoryPage } from './pages/HistoryPage';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<PitwallPage />} />
              <Route path="/dynamics" element={<DynamicsPage />} />
              <Route path="/powertrain" element={<PowertrainPage />} />
              <Route path="/battery" element={<BatteryPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
