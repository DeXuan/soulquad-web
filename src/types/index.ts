export type MBTI = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' |
                   'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export type SoulQuadrant = 'explorer' | 'builder' | 'artist' | 'philosopher';

export type UserTier = 'ordinary' | 'excellent' | 'top' | 'legend';

export type Gender = 'male' | 'female' | 'other';

export type NotificationType = 'match' | 'message' | 'like' | 'comment' | 'moment_like' | 'moment_comment' | 'daily_pick' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  password_hash?: string;
  nickname: string;
  age: number;
  gender: Gender;
  avatar_url: string;
  avatar_data: string;
  bio: string;
  mbti: MBTI | null;
  soul_quadrant: SoulQuadrant | null;
  soul_score: number;
  user_tier: UserTier;
  is_verified: boolean;
  profile_completed: boolean;
  ai_description: string;
  created_at: string;
  city?: string;
  height?: number;
  education?: string;
  occupation?: string;
  annual_income?: number;
  has_house?: boolean;
  has_car?: boolean;
  purpose?: string;
  mode?: string;
}

export interface SoulTest {
  id: string;
  user_id: string;
  mbti_result: MBTI | null;
  values: string[];
  interests: string[];
  soul_fingerprint: string;
  completed_at: string;
}

export interface Match {
  id: string;
  oder_a_id: string;
  oder_b_id: string;
  user_a_id: string;
  user_b_id: string;
  soulmate_index: number;
  user_a_liked: boolean;
  user_b_liked: boolean;
  mutual_liked: boolean;
  unlocked_level: number;
  match_status: 'pending' | 'matched' | 'rejected';
  created_at: string;
  matched_at: string | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'emoji' | 'audio';
  created_at: string;
  read_at: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface Comment {
  id: string;
  moment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Moment {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  video_url?: string;
  location?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  user?: User;
  is_liked?: boolean;
  comments?: Comment[];
  is_anonymous?: boolean;
  anonymous_name?: string;
}

export interface CreateMomentData {
  content: string;
  images?: string[];
  video_url?: string;
  location?: string;
  is_anonymous?: boolean;
}
