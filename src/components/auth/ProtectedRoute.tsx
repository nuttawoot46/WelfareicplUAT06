import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePinVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePinVerification = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // PIN verification is currently disabled
  // if (requirePinVerification && !isPinVerified) {
  //   return <Navigate to="/" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
