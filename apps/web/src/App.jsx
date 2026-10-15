import { Suspense, lazy } from 'react';
import { Center, Loader } from '@mantine/core';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { AppLayout } from './layout/AppLayout.jsx';
import { EmployeesPage } from './pages/EmployeesPage.jsx';
import { TransferActions } from './transfer/TransferActions.jsx';

// Charts are only needed on the insights page; keep them out of the initial bundle.
const InsightsPage = lazy(() => import('./pages/InsightsPage.jsx').then((m) => ({ default: m.InsightsPage })));

const pageLoader = (
  <Center mih={200}>
    <Loader />
  </Center>
);
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
        <Route path="/employees" element={<EmployeesPage toolbar={(params) => <TransferActions params={params} />} />} />
        <Route
          path="/insights"
          element={
            <Suspense fallback={pageLoader}>
              <InsightsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Route>
    </Routes>
  );
}
