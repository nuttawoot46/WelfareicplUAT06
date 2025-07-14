import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePinVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePinVerification = true 
}) => {
  const { user, isAuthenticated, isPinVerified, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If PIN verification is required but not yet verified
  // If the route requires PIN verification and it's not verified, redirect.
  if (requirePinVerification && !isPinVerified) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after
    // they log in.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
