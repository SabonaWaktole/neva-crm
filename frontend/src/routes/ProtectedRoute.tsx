import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { tenantSlug } = useParams();
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to={tenantSlug ? `/${tenantSlug}/login` : '/login'} replace />;
  }

  return <>{children}</>;
};
