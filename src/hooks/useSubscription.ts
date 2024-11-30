import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { FeatureLimit } from '../types/subscription';

export const useSubscription = () => {
  const { user } = useAuthStore();
  const [featureLimits, setFeatureLimits] = useState<Record<string, FeatureLimit>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatureLimits = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('user_feature_limits')
          .select('*')
          .single();

        if (error) throw error;
        if (!data) {
          throw new Error('No feature limits found');
        }

        setFeatureLimits(data.limits);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatureLimits();
  }, [user]);

  const checkFeatureAccess = async (featureCode: string, value: number | string = '1') => {
    if (!user) return false;

    try {
      const { data: hasAccess, error } = await supabase.rpc('check_feature_access', {
        p_user_id: user.id,
        p_feature_code: featureCode,
        p_value: value.toString()
      });

      if (error) throw error;

      return hasAccess;
    } catch (err) {
      console.error('Error checking feature access:', err);
      return false;
    }
  };

  const getFeatureLimit = (featureCode: string): FeatureLimit | undefined => {
    return featureLimits[featureCode];
  };

  const getCurrentUsage = async (featureCode: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase.rpc('get_feature_usage', {
        p_user_id: user.id,
        p_feature_code: featureCode
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error getting feature usage:', err);
      return 0;
    }
  };

  return {
    featureLimits,
    isLoading,
    error,
    checkFeatureAccess,
    getFeatureLimit,
    getCurrentUsage
  };
};
