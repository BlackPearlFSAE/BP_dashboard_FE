import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ThemeProvider } from './context/ThemeContext';

// Placeholder History Page
const HistoryPage = () => (
  <div className="p-10 text-center text-muted">
    <h2 className="text-2xl font-bold text-text mb-2">History Archives</h2>
    <p>Feature coming soon...</p>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
