import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: { userId: string; role: 'admin' | 'teacher' | 'student' } | null;
  login: (userId: string, role: 'admin' | 'teacher' | 'student', token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    // Check for student token on mount
    const token = localStorage.getItem('studentToken');
    const userId = localStorage.getItem('studentUserId');
    if (token && userId) {
      setUser({ userId, role: 'student' });
    }
  }, []);

  const login = (userId: string, role: 'admin' | 'teacher' | 'student', token?: string) => {
    setUser({ userId, role });
    if (role === 'student' && token) {
      localStorage.setItem('studentToken', token);
      localStorage.setItem('studentUserId', userId);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUserId');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
