import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canAccessRoute, getDefaultRouteForUser } from '../utils/authRoute';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required and user doesn't have it
  if (!canAccessRoute(user, allowedRoles)) {
    const fallback = getDefaultRouteForUser(user);
    return <Navigate to={fallback === location.pathname ? '/resources' : fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
