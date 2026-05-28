import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('soulquad_token');
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('soulquad_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.login(username, password);
    localStorage.setItem('soulquad_token', response.token);
    localStorage.setItem('soulquad_user', JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (username: string, password: string, nickname: string) => {
    const response = await api.register(username, password, nickname);
    localStorage.setItem('soulquad_token', response.token);
    localStorage.setItem('soulquad_user', JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('soulquad_token');
    localStorage.removeItem('soulquad_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('soulquad_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };
}
