// Core MiLyfe Types

export interface MiLyfeUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  mly_balance: number;
  city: string;
  neighborhood?: string;
  role: 'citizen' | 'business' | 'advocate' | 'admin';
  safety_mode: boolean;
  joined_at: string;
}

export interface MlyTransaction {
  id: string;
  from_id: string;
  to_id: string;
  amount: number;
  type: 'earn' | 'spend' | 'transfer' | 'ubi';
  description: string;
  created_at: string;
}

export interface CityIssue {
  id: string;
  title: string;
  description: string;
  category: 'infrastructure' | 'safety' | 'environment' | 'community' | 'transit';
  status: 'open' | 'in_progress' | 'resolved';
  location: { lat: number; lng: number };
  reporter_id: string;
  upvotes: number;
  created_at: string;
}

export interface HealthCheckin {
  id: string;
  user_id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  sleep_hours: number;
  notes?: string;
  created_at: string;
}

export interface ShopItem {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price_mly: number;
  category: string;
  image_url?: string;
  available: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface VaultDocument {
  id: string;
  user_id: string;
  type: 'id' | 'certificate' | 'record' | 'credential';
  title: string;
  file_url: string;
  verified: boolean;
  expires_at?: string;
  created_at: string;
}
