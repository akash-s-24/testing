export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  is_anonymous_default: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  alias?: string;
  emotion: string;
  category: string;
  hug_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id?: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  profiles?: {
    alias?: string;
  };
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id?: string;
  type: 'hug' | 'relate' | 'cheer';
  created_at: string;
}

export interface LifeTeaNotification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface MoodData {
  emotion: string;
  count: number;
}
