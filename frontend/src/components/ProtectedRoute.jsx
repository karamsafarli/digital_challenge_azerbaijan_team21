import { Navigate, useLocation } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext.jsx';
import FullScreenLoader from './FullScreenLoader.jsx';

/** Only lets users with the given role through; others go to login or their own home page. */
export default function ProtectedRoute({ role, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, role }} />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  return children;
}
