import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  apiRequest,
  clearSession,
  getStoredUser,
  setStoredUser,
  getServerUrl,
  setServerUrl as saveServerUrl,
  DEFAULT_SERVER_URL,
} from '../config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  serverUrl: string;
  updateServerUrl: (url: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverUrl, setServerUrlState] = useState<string>(DEFAULT_SERVER_URL);

  useEffect(() => {
    async function loadAuth() {
      try {
        const url = await getServerUrl();
        setServerUrlState(url);

        const cachedUser = await getStoredUser();
        if (cachedUser) {
          setUser(cachedUser);
        }

        // Validate session with server in background
        const res = await apiRequest('/api/auth/me');
        if (res.ok && res.data?.user) {
          setUser(res.data.user);
          await setStoredUser(res.data.user);
        } else if (res.status === 401) {
          setUser(null);
          await clearSession();
        }
      } catch (err) {
        console.log('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const updateServerUrl = async (newUrl: string) => {
    await saveServerUrl(newUrl);
    setServerUrlState(newUrl);
  };

  const login = async (email: string, password: string) => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (res.ok && res.data?.user) {
      setUser(res.data.user);
      await setStoredUser(res.data.user);
      return { success: true };
    }

    return {
      success: false,
      error: res.error || 'Login failed. Please check your credentials.',
    };
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    await clearSession();
  };

  const refreshUser = async () => {
    const res = await apiRequest('/api/auth/me');
    if (res.ok && res.data?.user) {
      setUser(res.data.user);
      await setStoredUser(res.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        serverUrl,
        updateServerUrl,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
