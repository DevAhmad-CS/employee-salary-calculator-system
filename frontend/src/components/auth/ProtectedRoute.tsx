import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../services/state/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Redirects to /login if user is not authenticated.
 * 
 * @param {React.ReactNode} children - The component to render if authenticated
 * @returns {JSX.Element} Either the protected component or redirect to login
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

