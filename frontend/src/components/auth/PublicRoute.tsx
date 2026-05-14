import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../services/state/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Public Route Component
 * 
 * Wraps routes that should only be accessible when NOT authenticated.
 * Redirects to /dashboard if user is already authenticated.
 * 
 * @param {React.ReactNode} children - The component to render if not authenticated
 * @returns {JSX.Element} Either the public component or redirect to dashboard
 */
export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

