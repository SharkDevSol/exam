import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Hook for JWT-based authentication (students only)
 * JWT tokens are stateless and stored in localStorage
 * No session persistence - students must re-login after browser close
 */
export function useJWT() {
  const { login, logout, user, isAuthenticated } = useAuth();

  const loginWithJWT = async (username: string, password: string) => {
    const response = await api.post('/student/login', { username, password });
    const { token, userId } = response.data;
    
    // Store JWT token in localStorage
    login(userId || username, 'student', token);
    return response.data;
  };

  const logoutWithJWT = () => {
    // No server-side logout needed for stateless JWT
    logout();
  };

  const getToken = (): string | null => {
    return localStorage.getItem('studentToken');
  };

  return {
    loginWithJWT,
    logoutWithJWT,
    getToken,
    user,
    isAuthenticated,
  };
}
