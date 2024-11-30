import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from "../store/auth/authStore";
import { logger } from '../services/logger';

interface Store {
  id: string;
}

const getStores = async (userId: string) => {
  logger.debug('ProductRedirect - Fetching stores for user', { userId });
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  logger.debug('ProductRedirect - Stores fetch result', { data, error });
  
  if (error) {
    logger.error('ProductRedirect - Error fetching stores:', error);
    throw error;
  }
  
  return data;
};

export default function ProductRedirect() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  logger.debug('ProductRedirect - Component mounted', { 
    hasUser: !!user,
    userId: user?.id
  });

  const { data: stores, isLoading, error } = useQuery({
    queryKey: ['product-redirect-stores', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        logger.debug('ProductRedirect - No user ID available');
        return null;
      }
      return getStores(user.id);
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    logger.debug('ProductRedirect - Effect running', { 
      isLoading,
      hasStores: !!stores,
      storesLength: stores?.length,
      hasUser: !!user,
      error: error?.message
    });

    if (!isLoading) {
      if (error) {
        logger.error('ProductRedirect - Error in stores query:', error);
        return;
      }

      if (!stores || stores.length === 0) {
        logger.debug('ProductRedirect - No stores found, redirecting to /stores/new');
        navigate('/stores/new', { replace: true });
      } else {
        const firstStoreId = stores[0].id;
        logger.debug('ProductRedirect - Found store, redirecting to products/add', { 
          storeId: firstStoreId,
          storeCount: stores.length
        });
        navigate(`/stores/${firstStoreId}/products/add`, { replace: true });
      }
    }
  }, [isLoading, stores, navigate, user, error]);

  if (isLoading) {
    logger.debug('ProductRedirect - Rendering loading state');
    return <div>Loading...</div>;
  }

  return null;
}
