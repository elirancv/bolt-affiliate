import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { getStore, updateStore, deleteStore } from '../../lib/api';
import type { Store, SocialLinks } from '../../types';
import FormField from '../../components/ui/FormField';

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/your-page' },
  { key: 'facebook_messenger', label: 'Facebook Messenger', placeholder: 'https://m.me/your-page' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your-handle' },
  { key: 'twitter', label: 'Twitter (X)', placeholder: 'https://twitter.com/your-handle' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/your-profile' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@your-channel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@your-handle' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'https://snapchat.com/add/your-username' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/your-profile' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/your-invite' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/your-number' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/your-username' },
  { key: 'google_business', label: 'Google Business', placeholder: 'https://business.google.com/your-business' },
] as const;

export default function StoreSettings() {
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [socialLinksPosition, setSocialLinksPosition] = useState<'header' | 'footer' | 'both'>('footer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { storeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadStore = async () => {
      if (!storeId) return;
      
      try {
        const data = await getStore(storeId);
        setStore(data);
        setName(data.name);
        setDescription(data.description || '');
        setSocialLinks(data.social_links || {});
        setSocialLinksPosition(data.social_links_position || 'footer');
      } catch (err: any) {
        console.error('Error loading store:', err);
        setError(err.message);
      }
    };

    loadStore();
  }, [storeId]);

  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    setLoading(true);
    setError('');

    try {
      await updateStore(storeId, {
        name,
        description,
        social_links: socialLinks,
        social_links_position: socialLinksPosition,
      });
      navigate('/stores');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!storeId || !confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteStore(storeId);
      navigate('/stores');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!store) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-600">Loading store settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Store Settings</h1>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
        >
          <Trash2 className="h-5 w-5" />
          <span>Delete Store</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {error && (
            <div className="p-6 bg-red-50 border-l-4 border-red-500">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
            
            <FormField label="Store Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>

          {/* Social Links */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Social Links</h2>
              <FormField label="Display Position">
                <select
                  value={socialLinksPosition}
                  onChange={(e) => setSocialLinksPosition(e.target.value as 'header' | 'footer' | 'both')}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="header">Header Only</option>
                  <option value="footer">Footer Only</option>
                  <option value="both">Both Header and Footer</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                <FormField key={key} label={label}>
                  <input
                    type="url"
                    value={socialLinks[key as keyof SocialLinks] || ''}
                    onChange={(e) => handleSocialLinkChange(key as keyof SocialLinks, e.target.value)}
                    placeholder={placeholder}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}