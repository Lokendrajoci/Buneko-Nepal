import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'admin' | 'superadmin' | 'customer';
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role requirement
  if (requireRole && user) {
    if (requireRole === 'admin' && user.role !== 'admin' && user.role !== 'superadmin') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requireRole === 'superadmin' && user.role !== 'superadmin') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requireRole === 'customer' && (user.role === 'admin' || user.role === 'superadmin')) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

