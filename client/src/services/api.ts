// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class APIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'APIError';
  }
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.error || 'Request failed', response.status);
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        0
      );
    }
  },

  get<T>(endpoint: string): Promise<T> {
    return apiClient.request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return apiClient.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
