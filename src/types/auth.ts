export interface UserMetadata {
  first_name?: string;
  last_name?: string;
  subscription_tier: 'free' | 'pro';
}

export interface User {
  id: string;
  email: string;
  metadata: UserMetadata;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
