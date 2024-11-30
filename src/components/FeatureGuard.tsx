import React, { useEffect, useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface FeatureGuardProps {
  featureCode: string;
  value?: number | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showUpgradeMessage?: boolean;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  featureCode,
  value = '1',
  children,
  fallback,
  redirectTo,
  showUpgradeMessage = true,
}) => {
  const navigate = useNavigate();
  const { checkFeatureAccess, getFeatureLimit } = useSubscription();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await checkFeatureAccess(featureCode, value);
      setHasAccess(access);

      if (!access && showUpgradeMessage) {
        const limit = getFeatureLimit(featureCode);
        const message = limit
          ? `Upgrade your plan to access more ${featureCode.replace(/_/g, ' ')}`
          : 'This feature is not available in your current plan';
        
        toast.error(message, {
          duration: 5000,
          action: {
            label: 'Upgrade',
            onClick: () => navigate('/subscription'),
          },
        });
      }

      if (!access && redirectTo) {
        navigate(redirectTo);
      }
    };

    checkAccess();
  }, [featureCode, value, showUpgradeMessage, redirectTo]);

  if (hasAccess === null) {
    return null; // or loading state
  }

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default FeatureGuard;
