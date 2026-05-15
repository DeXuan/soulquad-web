import { User, AuthResponse, Match, Message, Notification, Moment, Comment } from '../types';

const API_BASE = 'http://localhost:3001/api';
const MOCK_MODE = false; // Set to false when backend is ready

// Mock data storage for moments
const getMockMoments = (): Moment[] => {
  const stored = localStorage.getItem('mock_moments');
  return stored ? JSON.parse(stored) : [];
};

const setMockMoments = (moments: Moment[]) => {
  localStorage.setItem('mock_moments', JSON.stringify(moments));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock API implementations
const mockApi = {
  getMoments: async (page = 1, limit = 20) => {
    const moments = getMockMoments();
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      moments: moments.slice(start, end),
      hasMore: end < moments.length
    };
  },

  getUserMoments: async (userId: string) => {
    const moments = getMockMoments();
    return moments.filter(m => m.user_id === userId);
  },

  createMoment: async (data: { content: string; images?: string[]; video_url?: string; location?: string }) => {
    const userJson = localStorage.getItem('soulquad_user');
    const user = userJson ? JSON.parse(userJson) : null;
    const newMoment: Moment = {
      id: generateId(),
      user_id: user?.id || 'anonymous',
      content: data.content,
      images: data.images || [],
      video_url: data.video_url,
      location: data.location,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      created_at: new Date().toISOString(),
      user: user,
      is_liked: false,
      comments: []
    };
    try {
      const moments = getMockMoments();
      setMockMoments([newMoment, ...moments]);
      return newMoment;
    } catch (err) {
      // If storage is full, try without images
      if (data.images && data.images.length > 0) {
        const momentWithoutImages = { ...newMoment, images: [] };
        const moments = getMockMoments();
        setMockMoments([momentWithoutImages, ...moments]);
        return momentWithoutImages;
      }
      throw err;
    }
  },

  deleteMoment: async (momentId: string) => {
    const moments = getMockMoments();
    setMockMoments(moments.filter(m => m.id !== momentId));
  },

  likeMoment: async (momentId: string) => {
    const moments = getMockMoments();
    const moment = moments.find(m => m.id === momentId);
    if (moment) {
      moment.is_liked = true;
      moment.like_count += 1;
      setMockMoments(moments);
    }
    return { liked: true, like_count: moment?.like_count || 0 };
  },

  unlikeMoment: async (momentId: string) => {
    const moments = getMockMoments();
    const moment = moments.find(m => m.id === momentId);
    if (moment) {
      moment.is_liked = false;
      moment.like_count = Math.max(0, moment.like_count - 1);
      setMockMoments(moments);
    }
  },

  getMomentComments: async (momentId: string) => {
    const moments = getMockMoments();
    const moment = moments.find(m => m.id === momentId);
    return moment?.comments || [];
  },

  addComment: async (momentId: string, content: string) => {
    const userJson = localStorage.getItem('soulquad_user');
    const user = userJson ? JSON.parse(userJson) : null;
    const newComment: Comment = {
      id: generateId(),
      moment_id: momentId,
      user_id: user?.id || 'anonymous',
      content,
      created_at: new Date().toISOString(),
      user
    };
    const moments = getMockMoments();
    const moment = moments.find(m => m.id === momentId);
    if (moment) {
      if (!moment.comments) moment.comments = [];
      moment.comments.push(newComment);
      moment.comment_count = moment.comments.length;
      setMockMoments(moments);
    }
    return newComment;
  },

  deleteComment: async (momentId: string, commentId: string) => {
    const moments = getMockMoments();
    const moment = moments.find(m => m.id === momentId);
    if (moment && moment.comments) {
      moment.comments = moment.comments.filter(c => c.id !== commentId);
      moment.comment_count = moment.comments.length;
      setMockMoments(moments);
    }
  },

  updateProfile: async (data: Partial<User>) => {
    const userJson = localStorage.getItem('soulquad_user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (user) {
      const updated = { ...user, ...data };
      localStorage.setItem('soulquad_user', JSON.stringify(updated));
      return updated;
    }
    throw new Error('User not found');
  },

  uploadAvatar: async (avatarData: string) => {
    const userJson = localStorage.getItem('soulquad_user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (user) {
      user.avatar_data = avatarData;
      localStorage.setItem('soulquad_user', JSON.stringify(user));
      return { success: true, avatar_data: avatarData };
    }
    throw new Error('User not found');
  }
};

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('soulquad_token');
  const userJson = localStorage.getItem('soulquad_user');
  const user = userJson ? JSON.parse(userJson) : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    (headers as Record<string, string>)['x-user-id'] = user?.id || '';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
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

export interface IcebreakerResponse {
  topics: string[];
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
    localStorage.removeItem('soulquad_token');
    localStorage.removeItem('soulquad_user');
  },

  getMe: () => fetchApi<User>('/auth/me'),

  // Users
  updateProfile: (data: Partial<User>) =>
    MOCK_MODE ? mockApi.updateProfile(data) :
    fetchApi<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getUser: (id: string) => fetchApi<User>(`/users/${id}`),

  getUsers: () => fetchApi<User[]>('/users'),

  uploadAvatar: (avatarData: string) =>
    MOCK_MODE ? mockApi.uploadAvatar(avatarData) :
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

  getIcebreaker: (matchId: string) =>
    fetchApi<IcebreakerResponse>('/ai/icebreaker', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId })
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

  // Moments / Social Feed (using mock for demo)
  getMoments: (page = 1, limit = 20) =>
    MOCK_MODE ? mockApi.getMoments(page, limit) :
    fetchApi<{ moments: Moment[]; hasMore: boolean }>(`/moments?page=${page}&limit=${limit}`),

  getUserMoments: (userId: string) =>
    MOCK_MODE ? mockApi.getUserMoments(userId) :
    fetchApi<Moment[]>(`/moments/user/${userId}`),

  createMoment: (data: { content: string; images?: string[]; video_url?: string; location?: string; is_anonymous?: boolean }) =>
    MOCK_MODE ? mockApi.createMoment(data) :
    fetchApi<Moment>('/moments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteMoment: (momentId: string) =>
    MOCK_MODE ? mockApi.deleteMoment(momentId) :
    fetchApi<void>(`/moments/${momentId}`, {
      method: 'DELETE'
    }),

  likeMoment: (momentId: string) =>
    MOCK_MODE ? mockApi.likeMoment(momentId) :
    fetchApi<{ liked: boolean; like_count: number }>(`/moments/${momentId}/like`, {
      method: 'POST'
    }),

  unlikeMoment: (momentId: string) =>
    MOCK_MODE ? mockApi.unlikeMoment(momentId) :
    fetchApi<void>(`/moments/${momentId}/like`, {
      method: 'DELETE'
    }),

  getMomentComments: (momentId: string) =>
    MOCK_MODE ? mockApi.getMomentComments(momentId) :
    fetchApi<Comment[]>(`/moments/${momentId}/comments`),

  addComment: (momentId: string, content: string) =>
    MOCK_MODE ? mockApi.addComment(momentId, content) :
    fetchApi<Comment>(`/moments/${momentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  deleteComment: (momentId: string, commentId: string) =>
    MOCK_MODE ? mockApi.deleteComment(momentId, commentId) :
    fetchApi<void>(`/moments/${momentId}/comments/${commentId}`, {
      method: 'DELETE'
    })
};