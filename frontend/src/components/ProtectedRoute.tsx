import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function ProtectedRoute() {
  const { user, loading, guestMode } = useAuth();

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user && !guestMode) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
