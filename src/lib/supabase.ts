import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_path: string;
  friend_code: string;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  total_stickers: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Sticker {
  id: string;
  album_id: string;
  sticker_number: number;
  name: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export interface UserSticker {
  id: string;
  user_id: string;
  sticker_id: string;
  quantity: number;
  collected_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface Trade {
  id: string;
  requester_id: string;
  responder_id: string;
  offered_sticker_id: string;
  requested_sticker_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}