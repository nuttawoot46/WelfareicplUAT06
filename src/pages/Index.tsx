
import { useAuth } from '@/context/AuthContext';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-welfare-blue border-gray-200"></div>
      </div>
    );
  }

  // Redirect based on authentication status
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
};

export default Index;
