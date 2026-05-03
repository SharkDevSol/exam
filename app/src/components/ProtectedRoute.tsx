import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'teacher' | 'student'>;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on first allowed role
    const loginPath = redirectTo || `/${allowedRoles[0]}/login`;
    return <Navigate to={loginPath} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // User is authenticated but doesn't have the right role
    // Redirect to their own portal
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}
