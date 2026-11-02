import { apiClient } from './api';

export interface SavedPrediction {
  id: string;
  user_id: string;
  input_text: string;
  input_type: 'headline' | 'url';
  predicted_label: 'fake' | 'suspicious' | 'authentic';
  prediction_code: number;
  authenticity_score: number;
  confidence: number;
  detected_language: string;
  headline: string;
  model_version: string;
  created_at: string;
}

export interface HistoryResponse {
  history: SavedPrediction[];
  count: number;
  total?: number;
  page?: number;
  total_pages?: number;
  limit: number;
  offset: number;
}

export interface DashboardStats {
  total_analyses: number;
  fake_count: number;
  suspicious_count: number;
  authentic_count: number;
  fake_percentage: number;
  authentic_percentage: number;
  recent_activity?: string | null;
  recent_analyses: SavedPrediction[];
}

export const HistoryService = {
  async getHistory(params?: {
    q?: string;
    label?: string;
    limit?: number;
    page?: number;
    offset?: number;
    sort?: 'newest' | 'oldest';
  }): Promise<HistoryResponse> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.label) query.set('label', params.label);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.offset !== undefined) query.set('offset', params.offset.toString());
    if (params?.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return apiClient.get<HistoryResponse>(`/history${qs ? `?${qs}` : ''}`);
  },

  async getPrediction(id: string): Promise<SavedPrediction> {
    const res = await apiClient.get<{ prediction: SavedPrediction }>(`/history/${id}`);
    return res.prediction;
  },

  async deletePrediction(id: string): Promise<void> {
    await apiClient.delete(`/history/${id}`);
  },

  async clearHistory(): Promise<number> {
    const res = await apiClient.delete<{ message: string; deleted_count: number }>('/history');
    return res.deleted_count;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<{ stats: DashboardStats }>('/dashboard/stats');
    return res.stats;
  }
};
