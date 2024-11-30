import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { createStore } from '../../lib/api';
import { Store as StoreIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function CreateStore() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storeCount, setStoreCount] = useState(0);
  const { user } = useAuthStore();
  const { isWithinLimits, getRemainingLimit, fetchFeatureLimits, featureLimits } = useSubscriptionStore();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeData = async () => {
      if (!user) return;
      
      // Fetch feature limits
      await fetchFeatureLimits();
      
      // Fetch store count
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id);
      
      console.log('Store count query result:', { data, error });
      
      if (!error && data) {
        setStoreCount(data.length);
        console.log('Current store count:', data.length);
      }
    };

    initializeData();
  }, [user, fetchFeatureLimits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Debug logging for feature limits
    console.log('Current feature limits:', featureLimits);
    console.log('Current store count:', storeCount);
    console.log('Is within limits check:', isWithinLimits('stores', storeCount));

    // Check if user is within store limits
    if (!isWithinLimits('stores', storeCount)) {
      toast.error('Store Limit Reached', {
        description: 'You have reached your store limit. Please upgrade your plan to create more stores.'
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createStore({
        user_id: user.id,
        name,
        description,
        theme: 'default',
        status: 'active'
      });
      toast.success('Store created successfully');
      navigate('/stores');
    } catch (err: any) {
      setError(err.message);
      toast.error('Error', {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Store</h1>
        <button
          onClick={() => navigate('/stores')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Store Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}