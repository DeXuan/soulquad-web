import { User, AuthResponse, Match, Message, Notification, Moment, Comment } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  const token = localStorage.getItem('soulquad_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMsg = error.message || 'Request failed';
      // Handle 401/403 - redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('soulquad_token');
        localStorage.removeItem('soulquad_user');
        window.location.href = '/login';
      }
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (err) {
    if (retries > 0 && (err as Error).message === 'Request failed') {
      return fetchApi<T>(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export interface SoulDescription {
  description: string;
  traits: string;
  idealPartner: string;
  advice: string;
}

export interface LeaderboardUser {
  id: string;
  nickname: string;
  avatar_data: string;
  avatar_url: string;
  mbti: string;
  soul_quadrant: string;
  soul_score: number;
  user_tier: string;
  match_count: number;
  like_count?: number;
}

export interface City {
  code: string;
  name: string;
  province: string;
}

export const api = {
  // Auth
  register: (username: string, password: string, nickname: string) =>
    fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname })
    }),

  login: (username: string, password: string) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  logout: () => {
    const token = localStorage.getItem('soulquad_token');
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem('soulquad_token');
    localStorage.removeItem('soulquad_user');
  },

  getMe: () => fetchApi<User>('/auth/me'),

  // Users
  updateProfile: (data: Partial<User>) =>
    fetchApi<User & { success?: boolean; message?: string }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getUser: (id: string) => fetchApi<User>(`/users/${id}`),

  getUsers: () => fetchApi<User[]>('/users'),

  uploadAvatar: (avatarData: string) =>
    fetchApi<{ success: boolean; avatar_data: string }>('/users/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar_data: avatarData })
    }),

  // Leaderboard with type support
  getLeaderboard: (type?: string, tier?: string) => {
    let endpoint = '/users/tier/leaderboard';
    const params: string[] = [];
    if (type && type !== 'all') params.push(`type=${type}`);
    if (tier && tier !== 'all') params.push(`tier=${tier}`);
    if (params.length > 0) endpoint += '?' + params.join('&');
    return fetchApi<LeaderboardUser[]>(endpoint);
  },

  // User likes
  getLikes: () => fetchApi<User[]>('/users/likes'),

  cancelLike: (userId: string) =>
    fetchApi<void>('/users/likes/' + userId, {
      method: 'DELETE'
    }),

  // Block list
  getBlockList: () => fetchApi<User[]>('/users/blocklist'),

  blockUser: (userId: string) =>
    fetchApi<void>('/users/block/' + userId, {
      method: 'POST'
    }),

  unblockUser: (userId: string) =>
    fetchApi<void>('/users/block/' + userId, {
      method: 'DELETE'
    }),

  // Cities
  getCities: () => fetchApi<City[]>('/cities'),

  searchCities: (query: string) =>
    fetchApi<City[]>(`/cities/search?q=${encodeURIComponent(query)}`),

  // Soul Test
  submitSoulTest: (data: {
    mbti: string;
    soul_quadrant: string;
    values: string[];
    interests: string[];
    assets?: {
      has_house: boolean | null;
      house_location: string;
      house_value: number | null;
      has_car: boolean | null;
      car_brand: string;
      car_value: number | null;
    };
    credit?: {
      education: string;
      ant_credit_score: number | null;
      annual_income: number | null;
      has_credit_report: boolean | null;
    };
    profile_score?: number;
  }) => fetchApi<User>('/soul-test', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // AI
  generateSoulDescription: () =>
    fetchApi<SoulDescription>('/ai/soul-description', {
      method: 'POST'
    }),

  // Matching
  getMatches: () => fetchApi<Match[]>('/matches'),

  getPotentialMatches: (params?: {
    location_mode?: string;
    city_code?: string;
    gender?: string;
    age_min?: number;
    age_max?: number;
    education?: string;
    mode?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return fetchApi<User[]>(`/matches/potential${query ? '?' + query : ''}`);
  },

  likeUser: (userId: string) =>
    fetchApi<{ matched: boolean; match?: Match }>(`/matches/like/${userId}`, {
      method: 'POST'
    }),

  passUser: (userId: string) =>
    fetchApi<void>(`/matches/pass/${userId}`, {
      method: 'POST'
    }),

  // Messages
  getMessages: (matchId: string) =>
    fetchApi<Message[]>(`/messages/${matchId}`),

  sendMessage: (matchId: string, content: string) =>
    fetchApi<Message>(`/messages/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  sendImageMessage: (matchId: string, imageData: string) =>
    fetchApi<Message>(`/messages/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ content: imageData, message_type: 'image' })
    }),

  sendAudioMessage: (matchId: string, audioData: string) =>
    fetchApi<Message>(`/messages/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ content: audioData, message_type: 'audio' })
    }),

  markMessagesRead: (matchId: string) =>
    fetchApi<void>(`/messages/${matchId}/read`, {
      method: 'POST'
    }),

  retractMessage: (matchId: string, messageId: string) =>
    fetchApi<void>(`/messages/${matchId}/${messageId}`, {
      method: 'DELETE'
    }),

  // Notifications
  getNotifications: (type?: string) => {
    const endpoint = type ? `/notifications?type=${type}` : '/notifications';
    return fetchApi<Notification[]>(endpoint);
  },

  getUnreadCount: () => fetchApi<{ count: number }>('/notifications/unread-count'),

  markNotificationRead: (id: string) =>
    fetchApi<void>(`/notifications/mark-read/${id}`, {
      method: 'POST'
    }),

  markAllNotificationsRead: () =>
    fetchApi<void>('/notifications/mark-all-read', {
      method: 'POST'
    }),

  // Moments / Social Feed
  getMoments: (page = 1, limit = 20) =>
    fetchApi<{ moments: Moment[]; hasMore: boolean }>(`/moments?page=${page}&limit=${limit}`),

  getUserMoments: (userId: string) =>
    fetchApi<Moment[]>(`/moments/user/${userId}`),

  createMoment: (data: { content: string; images?: string[]; video_url?: string; location?: string; is_anonymous?: boolean }) =>
    fetchApi<Moment>('/moments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteMoment: (momentId: string) =>
    fetchApi<void>(`/moments/${momentId}`, {
      method: 'DELETE'
    }),

  likeMoment: (momentId: string) =>
    fetchApi<{ liked: boolean; like_count: number }>(`/moments/${momentId}/like`, {
      method: 'POST'
    }),

  unlikeMoment: (momentId: string) =>
    fetchApi<void>(`/moments/${momentId}/like`, {
      method: 'DELETE'
    }),

  getMomentComments: (momentId: string) =>
    fetchApi<Comment[]>(`/moments/${momentId}/comments`),

  addComment: (momentId: string, content: string) =>
    fetchApi<Comment>(`/moments/${momentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  deleteComment: (momentId: string, commentId: string) =>
    fetchApi<void>(`/moments/${momentId}/comments/${commentId}`, {
      method: 'DELETE'
    })
};