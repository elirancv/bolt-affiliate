import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { ArrowLeft, X, Store, Package, Settings, FileText, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  actions?: React.ReactNode;
  className?: string;
  icon?: string | React.ElementType;
}

const fadeInUp = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
};

const iconMap: Record<string, React.ElementType> = {
  store: Store,
  package: Package,
  settings: Settings,
  pages: FileText,
  analytics: BarChart2,
};

const PageHeader = ({
  title,
  subtitle,
  showBackButton,
  showCloseButton,
  onBack,
  onClose,
  actions,
  className,
  icon,
}: PageHeaderProps) => {
  const IconComponent = typeof icon === 'string' ? iconMap[icon.toLowerCase()] : icon;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className={cn(
        "flex items-center justify-between mb-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div>
          <div className="flex items-center gap-3">
            {IconComponent && (
              <IconComponent className="h-6 w-6 text-gray-600" />
            )}
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions}
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;
