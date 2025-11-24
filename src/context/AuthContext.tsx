import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import { api } from '../api/axios';
import type { UserProfile, Notification } from '../types/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  notifications: Notification[];
  loginSuccess: (token: string) => void;
  logout: () => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- Notification System ---
  const addNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  // --- Auth Logic ---
  const handleUserParse = useCallback((accessToken: string) => {
    try {
      const decoded: any = jwtDecode(accessToken);
      const extractedRoles = decoded.roles || decoded.authorities || [];
      setUser({
        username: decoded.sub || 'User',
        roles: extractedRoles,
        exp: decoded.exp,
      });
      // Set global header for immediate use
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (e) {
      console.error("Token parse failed", e);
      setUser(null);
      throw e; // Re-throw to trigger fallback
    }
  }, []);

  const loginSuccess = useCallback((accessToken: string) => {
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    handleUserParse(accessToken);
  }, [handleUserParse]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
      addNotification('success', 'Logged out successfully');
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [addNotification]);

  // --- Initialization (Enhanced) ---
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      
      // 1. Try Local Storage First
      if (storedToken) {
        try {
          handleUserParse(storedToken);
          setToken(storedToken);
          setIsLoading(false);
          return; // Session restored!
        } catch (e) {
          console.warn("Local token invalid, attempting silent refresh...");
          localStorage.removeItem('accessToken');
        }
      }

      // 2. Fallback: Try Silent Refresh (HttpOnly Cookie)
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.accessToken) {
          loginSuccess(data.accessToken);
        }
      } catch (e) {
        // User is truly a guest
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [handleUserParse, loginSuccess]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, notifications, loginSuccess, logout, addNotification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};