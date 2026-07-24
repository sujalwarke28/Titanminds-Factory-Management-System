import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MachineDataProvider } from './hooks/useMachineData';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PortalLayout from './layouts/PortalLayout';

// Admin Modules
import AdminDashboard from './pages/admin/Dashboard';
import FactoryOverview from './pages/admin/FactoryOverview';
import MachineManagement from './pages/admin/MachineManagement';
import AdminAiAnalytics from './pages/admin/AiAnalytics';
import InfrastructureHealth from './pages/admin/InfrastructureHealth';
import AdminLiveTelemetry from './pages/admin/LiveTelemetry';
import UserManagement from './pages/admin/UserManagement';
import AdminAlerts from './pages/admin/Alerts';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Manager Modules
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerFactoryOverview from './pages/manager/FactoryOverview';
import ProductionAnalytics from './pages/manager/ProductionAnalytics';
import MachineHealth from './pages/manager/MachineHealth';
import MaintenanceSchedule from './pages/manager/MaintenanceSchedule';
import FinancialInsights from './pages/manager/FinancialInsights';
import ManagerAlerts from './pages/manager/Alerts';
import ManagerReports from './pages/manager/Reports';

import ManagerLiveTelemetry from './pages/manager/LiveTelemetry';

// Engineer Modules
import EngineerDashboard from './pages/engineer/Dashboard';
import MachineDiagnostics from './pages/engineer/MachineDiagnostics';
import LiveTelemetry from './pages/engineer/LiveTelemetry';
import EngineerAiPredictions from './pages/engineer/AiPredictions';
import MaintenanceCenter from './pages/engineer/MaintenanceCenter';
import MachineAnalytics from './pages/engineer/MachineAnalytics';
import EngineerAlerts from './pages/engineer/Alerts';
import EngineerReports from './pages/engineer/Reports';

const AppContent = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const { userRole } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/login" element={<Login theme={theme} toggleTheme={toggleTheme} />} />

      {/* Admin Portal */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="factory-overview" element={<FactoryOverview />} />
        <Route path="machine-management" element={<MachineManagement />} />
        <Route path="ai-analytics" element={<AdminAiAnalytics />} />
        <Route path="live-telemetry" element={<AdminLiveTelemetry />} />
        <Route path="infrastructure-health" element={<InfrastructureHealth />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Manager Portal */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><PortalLayout theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>}>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="factory-overview" element={<ManagerFactoryOverview />} />
        <Route path="production-analytics" element={<ProductionAnalytics />} />
        <Route path="machine-health" element={<MachineHealth />} />
        <Route path="live-telemetry" element={<ManagerLiveTelemetry />} />
        <Route path="maintenance-schedule" element={<MaintenanceSchedule />} />
        <Route path="financial-insights" element={<FinancialInsights />} />
        <Route path="alerts" element={<ManagerAlerts />} />
        <Route path="reports" element={<ManagerReports />} />
      </Route>

      {/* Engineer Portal */}
      <Route path="/engineer" element={<ProtectedRoute allowedRoles={['engineer']}><PortalLayout theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>}>
        <Route index element={<Navigate to="/engineer/dashboard" replace />} />
        <Route path="dashboard" element={<EngineerDashboard />} />
        <Route path="machine-diagnostics" element={<MachineDiagnostics />} />
        <Route path="live-telemetry" element={<LiveTelemetry />} />
        <Route path="ai-predictions" element={<EngineerAiPredictions />} />
        <Route path="maintenance-center" element={<MaintenanceCenter />} />
        <Route path="machine-analytics" element={<MachineAnalytics />} />
        <Route path="alerts" element={<EngineerAlerts />} />
        <Route path="reports" element={<EngineerReports />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MachineDataProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              },
              success: { iconTheme: { primary: 'var(--color-success)', secondary: 'white' } },
              error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'white' } },
            }} 
          />
          <AppContent />
        </MachineDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
