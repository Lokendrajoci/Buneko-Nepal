import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

/**
 * Hook to maintain session and refresh token periodically
 */
export const useSession = () => {
  const { isAuthenticated, refreshUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh user data every 5 minutes
    const refreshInterval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Verify session on mount
    const verifySession = async () => {
      try {
        await api.getCurrentUser();
      } catch (error) {
        console.error('Session verification failed:', error);
      }
    };

    verifySession();

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, refreshUser]);
};

