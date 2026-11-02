import { apiClient } from './api';
import { FactCheckArticle } from './factCheckService';

export interface RecommendationItem extends FactCheckArticle {
  recommendation_score?: number;
  match_reason?: string;
  is_saved?: boolean;
}

export interface EducationalTip {
  id: string;
  title: string;
  summary: string;
  badge: string;
  icon: string;
}

export interface CategoryItem {
  name: string;
  count: number;
}

export interface RecommendationPagination {
  has_more: boolean;
  total_eligible: number;
  returned_count: number;
  offset: number;
  limit: number;
  cursor?: string;
  next_cursor?: string | null;
}

export interface RecommendationResponse {
  recommended: RecommendationItem[];
  trending: RecommendationItem[];
  educational_tips: EducationalTip[];
  categories: CategoryItem[];
  user_preferences: {
    preferred_language: string;
    selected_interests: string[];
    onboarding_completed: boolean;
  };
  pagination?: RecommendationPagination;
  last_refreshed_at?: string;
}

export const RecommendationService = {
  async getRecommendations(params?: {
    category?: string;
    language?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
    exclude_ids?: string[];
    refresh?: boolean;
    seed?: string;
  }): Promise<RecommendationResponse> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params?.language && params.language !== 'all') {
      query.append('language', params.language);
    }
    if (params?.limit) {
      query.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      query.append('offset', params.offset.toString());
    }
    if (params?.cursor) {
      query.append('cursor', params.cursor);
    }
    if (params?.exclude_ids && params.exclude_ids.length > 0) {
      query.append('exclude_ids', params.exclude_ids.join(','));
    }
    if (params?.refresh) {
      query.append('refresh', 'true');
    }
    if (params?.seed) {
      query.append('seed', params.seed);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<RecommendationResponse>(`/recommendations${qs}`);
  },

  async refreshRecommendations(payload?: {
    category?: string;
    language?: string;
    limit?: number;
    exclude_ids?: string[];
    seed?: string;
  }): Promise<RecommendationResponse> {
    return apiClient.post<RecommendationResponse>('/recommendations/refresh', payload || {});
  },

  async recordInteraction(articleId: string, interactionType: 'viewed' | 'saved' | 'dismissed'): Promise<void> {
    try {
      await apiClient.post('/recommendations/interact', {
        article_id: articleId,
        interaction_type: interactionType
      });
    } catch (e) {
      console.warn('Failed to record user interaction:', e);
    }
  }
};
