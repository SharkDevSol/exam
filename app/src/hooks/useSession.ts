import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Hook for session-based authentication (admin/teacher)
 * Sessions are persistent and stored server-side
 */
export function useSession() {
  const { login, logout, user, isAuthenticated } = useAuth();

  const loginWithSession = async (
    username: string, 
    password: string, 
    role: 'admin' | 'teacher'
  ) => {
    const endpoint = role === 'admin' ? '/admin/login' : '/teacher/login';
    const response = await api.post(endpoint, { username, password });
    
    // Session cookie is set by the server automatically
    login(response.data.userId || username, role);
    return response.data;
  };

  const logoutWithSession = async () => {
    if (!user) return;
    
    const endpoint = user.role === 'admin' ? '/admin/logout' : '/teacher/logout';
    try {
      await api.post(endpoint);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  };

  return {
    loginWithSession,
    logoutWithSession,
    user,
    isAuthenticated,
  };
}
