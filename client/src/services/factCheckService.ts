import { apiClient } from './api';

export interface FactCheckArticle {
  id: string;
  external_id: string;
  claim_text: string;
  claimant?: string | null;
  fact_check_publisher: string;
  publisher_rating: string;
  normalized_verdict: 'False' | 'Misleading' | 'Partly False' | 'True' | 'Other';
  fact_check_url: string;
  review_date: string;
  language: string;
  category: string;
  country: string;
  source_api: string;
  explanation?: string;
  image_url?: string | null;
  image_source?: string | null;
  image_caption?: string | null;
  first_seen_at: string;
  last_synced_at: string;
}

export interface FactCheckFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  category?: string;
  verdict?: string;
  sort?: string;
  exclude_ids?: string[] | string;
  refresh?: boolean;
  seed?: string;
}

export interface FactCheckListResponse {
  fact_checks: FactCheckArticle[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  last_synced_at?: string | null;
  sync_status: string;
  is_syncing: boolean;
}

export interface SyncStatusResponse {
  last_synced_at?: string | null;
  last_sync_status: string;
  records_count: number;
  last_error?: string | null;
  is_syncing: boolean;
  sync_interval_minutes: number;
  google_api_configured: boolean;
}

export const factCheckService = {
  /**
   * Fetches paginated & filtered fact checks from the database-backed feed.
   * Does NOT consume external API quotas.
   */
  async getFactChecks(params: FactCheckFilterParams = {}): Promise<FactCheckListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.language && params.language !== 'all') query.set('language', params.language);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.verdict && params.verdict !== 'all') query.set('verdict', params.verdict);
    if (params.sort) query.set('sort', params.sort);
    if (params.exclude_ids) {
      const ids = Array.isArray(params.exclude_ids) ? params.exclude_ids.join(',') : params.exclude_ids;
      if (ids) query.set('exclude_ids', ids);
    }
    if (params.refresh) query.set('refresh', 'true');
    if (params.seed) query.set('seed', params.seed);

    const qs = query.toString();
    const endpoint = `/fact-checks${qs ? `?${qs}` : ''}`;
    return apiClient.get<FactCheckListResponse>(endpoint);
  },

  /**
   * Fetches single fact check record by ID
   */
  async getFactCheckById(id: string): Promise<{ fact_check: FactCheckArticle }> {
    return apiClient.get<{ fact_check: FactCheckArticle }>(`/fact-checks/${id}`);
  },

  /**
   * Fetches recent 5-10 claims for dashboard & sidebar integration
   */
  async getLatestFactChecks(limit = 6): Promise<{ latest: FactCheckArticle[] }> {
    return apiClient.get<{ latest: FactCheckArticle[] }>(`/fact-checks/latest?limit=${limit}`);
  },

  /**
   * Retrieves background synchronization health & scheduling telemetry
   */
  async getSyncStatus(): Promise<SyncStatusResponse> {
    return apiClient.get<SyncStatusResponse>('/fact-checks/sync-status');
  },

  /**
   * Triggers an authorized background synchronization.
   * Rate-limited to prevent abuse.
   */
  async triggerRefresh(): Promise<{ message: string; is_syncing: boolean }> {
    return apiClient.post<{ message: string; is_syncing: boolean }>('/fact-checks/refresh');
  }
};
