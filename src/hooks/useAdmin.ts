import { useState, useEffect } from 'react';
import { checkAdminStatus } from '../lib/admin';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkAdminStatus();
        setIsAdmin(status);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check admin status');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { isAdmin, loading, error };
}