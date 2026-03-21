import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'superadmin';
  phone?: string;
  address?: string;
  profile_image_url?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage and state regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error refreshing user:', error);
      // Only clear storage if it's an actual authentication error
      if (error.message && (
        error.message.includes('Authentication failed') ||
        error.message.includes('401') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Invalid token') ||
        error.message.includes('Token expired')
      )) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      // For network errors, keep the existing session
      return false;
    }
  }, []);

  // Load user from localStorage and verify token on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          // Set user immediately from localStorage for instant UI
          setUser(userData);
          
          // Verify token is still valid in the background (non-blocking)
          // Don't clear session on network errors, only on actual auth failures
          try {
            const response = await api.getCurrentUser();
            if (response.success && response.data) {
              // Update user data if it changed
              const updatedUser = response.data.user;
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
          } catch (error: any) {
            // Only clear session if it's an actual authentication error
            // Network errors or temporary issues shouldn't log the user out
            const errorMsg = error.message || '';
            const isAuthError = errorMsg.includes('Authentication failed') ||
                              errorMsg.includes('401') || 
                              errorMsg.includes('Unauthorized') ||
                              errorMsg.includes('Invalid token') ||
                              errorMsg.includes('Token expired') ||
                              errorMsg.includes('Authentication required') ||
                              errorMsg.includes('Token required');
            
            if (isAuthError) {
              console.warn('Token validation failed, clearing session');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setUser(null);
            } else {
              // Network error or other issue - keep the session
              // User is already set from localStorage, so they stay logged in
              console.warn('Token validation check failed (network issue?), keeping session:', errorMsg);
            }
          }
        } catch (error) {
          console.error('Error loading user:', error);
          // Only clear if JSON parse failed
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        // No stored session
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Session refresh - refresh user data periodically
  useEffect(() => {
    if (!user) return;

    // Refresh user data every 5 minutes
    const refreshInterval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        return userData; // Return user data for immediate use
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login. Please check your credentials.');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await api.register(name, email, password);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to register. Please try again.');
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
