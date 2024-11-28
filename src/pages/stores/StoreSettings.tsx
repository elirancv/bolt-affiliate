import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoreForm } from '../../hooks/useStoreForm';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  ArrowLeft,
  Save,
  Facebook,
  Instagram,
  Phone,
  MapPin,
  MessagesSquare,
  AlertCircle,
} from 'lucide-react';

const SOCIAL_PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://fb.me/your-page',
    icon: Facebook,
  },
  {
    key: 'messenger',
    label: 'Facebook Messenger',
    placeholder: 'https://m.me/your-id',
    icon: MessagesSquare,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/your-handle',
    icon: Instagram,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    placeholder: 'https://wa.me/your-number',
    icon: Phone,
  },
  {
    key: 'google_maps',
    label: 'Google Maps',
    placeholder: 'https://maps.app.goo.gl/your-location',
    icon: MapPin,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export default function StoreSettings() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const {
    formData,
    state: { isLoading, isSaving, error, isDirty },
    updateField,
    updatePromotionSettings,
    updateSocialLink,
    handleSubmit,
    resetForm,
  } = useStoreForm({
    storeId: storeId!,
    onSuccess: () => {
      // Instead of navigating away, just show success message
      // The user can manually go back using the back button
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Store not found</h2>
        <p className="text-gray-600 mb-4">The store you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/stores')}>Back to Stores</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Store Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Customize and configure your store
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={!isDirty || isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start space-x-3"
        >
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div>
            <h3 className="font-medium">Error Saving Changes</h3>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Basic Settings */}
        <motion.div {...fadeInUp}>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="grid gap-6">
                <div>
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) =>
                      updateField('description', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Promotion Settings */}
        <motion.div {...fadeInUp}>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Promotion Settings
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="banner-enabled"
                      className="mb-0 font-medium"
                    >
                      Enable Promotion Banner
                    </Label>
                    <p className="text-sm text-gray-500">
                      Show a promotional message at the top of your store
                    </p>
                  </div>
                  <Switch
                    id="banner-enabled"
                    checked={formData.promotion_settings?.banner_enabled || false}
                    onCheckedChange={(checked) =>
                      updatePromotionSettings('banner_enabled', checked)
                    }
                  />
                </div>

                <AnimatePresence>
                  {formData.promotion_settings?.banner_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="banner-text">Banner Text</Label>
                        <Input
                          id="banner-text"
                          value={formData.promotion_settings.banner_text}
                          onChange={(e) =>
                            updatePromotionSettings('banner_text', e.target.value)
                          }
                          placeholder="🎉 Free shipping on orders over $50"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="shipping-threshold">
                          Free Shipping Threshold ($)
                        </Label>
                        <Input
                          id="shipping-threshold"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.promotion_settings.free_shipping_threshold}
                          onChange={(e) =>
                            updatePromotionSettings(
                              'free_shipping_threshold',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Social Links */}
        <motion.div {...fadeInUp}>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Social Links
                </h2>
                <div className="relative group">
                  <select
                    value={formData.social_links_position || 'footer'}
                    onChange={(e) =>
                      updateField(
                        'social_links_position',
                        e.target.value as 'header' | 'footer' | 'both'
                      )
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <option value="header">Header Only</option>
                    <option value="footer">Footer Only</option>
                    <option value="both">Both Header and Footer</option>
                  </select>
                  <div className="absolute hidden group-hover:block -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    Choose where to display social links
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder, icon: Icon }) => (
                  <div key={key} className="flex items-start space-x-3">
                    <div className="pt-2">
                      <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        placeholder={placeholder}
                        value={formData.social_links?.[key] || ''}
                        onChange={(e) =>
                          updateSocialLink(key, e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}