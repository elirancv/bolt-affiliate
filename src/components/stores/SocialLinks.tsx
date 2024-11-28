import React from 'react';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Camera,
  CircleUserRound,
  MessageSquare,
  Phone,
  Send,
  MessagesSquare,
  Building2
} from 'lucide-react';
import type { SocialLinks as SocialLinksType } from '../../types';

interface SocialLinksProps {
  links: SocialLinksType;
  className?: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'facebook', icon: Facebook, color: '#1877F2', label: 'Facebook' },
  { key: 'facebook_messenger', icon: MessagesSquare, color: '#00B2FF', label: 'Facebook Messenger' },
  { key: 'instagram', icon: Instagram, color: '#E4405F', label: 'Instagram' },
  { key: 'twitter', icon: Twitter, color: '#1DA1F2', label: 'Twitter (X)' },
  { key: 'linkedin', icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
  { key: 'youtube', icon: Youtube, color: '#FF0000', label: 'YouTube' },
  { key: 'tiktok', icon: MessageCircle, color: '#000000', label: 'TikTok' },
  { key: 'snapchat', icon: Camera, color: '#FFFC00', label: 'Snapchat' },
  { key: 'pinterest', icon: CircleUserRound, color: '#E60023', label: 'Pinterest' },
  { key: 'discord', icon: MessageSquare, color: '#5865F2', label: 'Discord' },
  { key: 'whatsapp', icon: Phone, color: '#25D366', label: 'WhatsApp' },
  { key: 'telegram', icon: Send, color: '#0088cc', label: 'Telegram' },
  { key: 'google_business', icon: Building2, color: '#4285F4', label: 'Google Business' },
] as const;

export default function SocialLinks({ links, className = '' }: SocialLinksProps) {
  const hasSocialLinks = Object.values(links).some(link => !!link);

  if (!hasSocialLinks) return null;

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {SOCIAL_PLATFORMS.map(({ key, icon: Icon, color, label }) => {
        const link = links[key as keyof SocialLinksType];
        if (!link) return null;

        return (
          <a
            key={key}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition-colors social-link"
            aria-label={label}
            title={label}
            style={{ 
              '--social-hover-color': color
            } as React.CSSProperties}
          >
            <Icon className="h-6 w-6" />
          </a>
        );
      })}
    </div>
  );
}

const style = document.createElement('style');
style.textContent = `
  .social-link:hover {
    color: var(--social-hover-color) !important;
  }
`;
document.head.appendChild(style);