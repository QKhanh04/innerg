import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { getDefaultRouteForUser } from '../utils/authRoute';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return children;
};
export default PublicRoute;
