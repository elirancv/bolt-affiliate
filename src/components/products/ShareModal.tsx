import React from 'react';
import { X, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';
import type { Product } from '../../types';

interface ShareModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ product, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = window.location.href;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.name)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform: string) => {
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || '',
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      window.open(shareLinks[platform as keyof typeof shareLinks], '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Product</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => handleShare('facebook')}
              className="flex flex-col items-center space-y-2 text-gray-600 hover:text-[#1877F2]"
            >
              <div className="p-3 rounded-full bg-gray-100 hover:bg-blue-50">
                <Facebook className="h-6 w-6" />
              </div>
              <span className="text-sm">Facebook</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="flex flex-col items-center space-y-2 text-gray-600 hover:text-[#1DA1F2]"
            >
              <div className="p-3 rounded-full bg-gray-100 hover:bg-blue-50">
                <Twitter className="h-6 w-6" />
              </div>
              <span className="text-sm">Twitter</span>
            </button>
          </div>

          <div className="relative mt-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="w-full pr-20 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}