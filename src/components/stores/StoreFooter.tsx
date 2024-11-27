import React from 'react';
import type { SocialLinks } from '../../types';
import SocialLinksComponent from './SocialLinks';

interface StoreFooterProps {
  storeName: string;
  socialLinks: SocialLinks;
  showSocialLinks: boolean;
}

export default function StoreFooter({ storeName, socialLinks, showSocialLinks }: StoreFooterProps) {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-4">
          {showSocialLinks && <SocialLinksComponent links={socialLinks} />}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}