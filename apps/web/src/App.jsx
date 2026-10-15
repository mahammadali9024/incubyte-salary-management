import { Center, Loader } from '@mantine/core';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { AppLayout } from './layout/AppLayout.jsx';
import { EmployeesPage } from './pages/EmployeesPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    );
  }
  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Route>
    </Routes>
  );
}
