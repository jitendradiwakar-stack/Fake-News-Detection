import { apiClient } from './api';

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  preferred_language?: string;
  selected_interests?: string[];
  onboarding_completed?: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface SignupData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password?: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface AccountData {
  user: User;
  stats: {
    total_analyses: number;
    fake_count: number;
    suspicious_count: number;
    authentic_count: number;
    fake_percentage: number;
    authentic_percentage: number;
  };
}

export const AuthService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/signup', data);
    if (res.token) {
      localStorage.setItem('satyacheck_token', res.token);
      localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
    }
    return res;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    if (res.token) {
      localStorage.setItem('satyacheck_token', res.token);
      localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API notification failed:', e);
    } finally {
      localStorage.removeItem('satyacheck_token');
      localStorage.removeItem('satyacheck_user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('satyacheck_token');
    if (!token) return null;
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
      return res.user;
    } catch {
      localStorage.removeItem('satyacheck_token');
      localStorage.removeItem('satyacheck_user');
      return null;
    }
  },

  getStoredUser(): User | null {
    try {
      const u = localStorage.getItem('satyacheck_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('satyacheck_token');
  },

  async getAccount(): Promise<AccountData> {
    return apiClient.get<AccountData>('/account');
  },

  async updateAccount(data: {
    full_name?: string;
    username?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
  }): Promise<User> {
    const res = await apiClient.patch<{ message: string; user: User }>('/account', data);
    localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
    return res.user;
  },

  async updatePreferences(data: {
    preferred_language?: string;
    selected_interests?: string[];
  }): Promise<User> {
    const res = await apiClient.post<{ message: string; user: User }>('/account/preferences', data);
    localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
    return res.user;
  },

  async completeOnboarding(data?: {
    preferred_language?: string;
    selected_interests?: string[];
  }): Promise<User> {
    const res = await apiClient.post<{ message: string; user: User }>('/account/onboarding-complete', data || {});
    localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
    return res.user;
  },

  async resetOnboarding(): Promise<User> {
    const res = await apiClient.post<{ message: string; user: User }>('/account/onboarding-reset', {});
    localStorage.setItem('satyacheck_user', JSON.stringify(res.user));
    return res.user;
  }
};
