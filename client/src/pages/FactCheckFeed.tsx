import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Clock,
  Globe,
  Calendar,
  Cpu,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight,
  Quote,
  LayoutDashboard,
  History,
  Settings,
  Newspaper,
  Check,
  X,
  Radio,
  Bell,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UserNav } from '@/components/UserNav';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  factCheckService,
  FactCheckArticle,
  SyncStatusResponse
} from '@/services/factCheckService';
import { detectNews, DetectionResult } from '@/services/detection';
import { NewsCard } from '@/components/NewsCard';
import { NewsImage } from '@/components/NewsImage';
import { DisinformationAlertsModal } from '@/components/DisinformationAlertsModal';
import { ForensicFeedbackModal } from '@/components/ForensicFeedbackModal';
import { toast } from 'sonner';

export const FactCheckFeed = () => {
  // Feed state
  const [articles, setArticles] = useState<FactCheckArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncMeta, setSyncMeta] = useState<SyncStatusResponse | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('newest');

  // Track session seen article IDs to cycle through all eligible claims on refresh
  const seenArticleIdsRef = useRef<Set<string>>(new Set());

  // Reset seen tracking when filter criteria change
  useEffect(() => {
    seenArticleIdsRef.current.clear();
  }, [selectedLanguage, selectedCategory, selectedVerdict, debouncedSearch]);

  // Modals state
  const [selectedArticle, setSelectedArticle] = useState<FactCheckArticle | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Analyze with SatyaCheck state
  const [analyzingArticle, setAnalyzingArticle] = useState<FactCheckArticle | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mlResult, setMlResult] = useState<DetectionResult | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);

  // Disinformation Alerts & Forensic Feedback Modals
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);
  const [feedbackInitialClaim, setFeedbackInitialClaim] = useState('');

  const handleAnalyzeClaimFromAlert = (claimText: string) => {
    setAlertsModalOpen(false);
    const mockArticle: FactCheckArticle = {
      id: 'alert-' + Date.now(),
      claim_text: claimText,
      verdict: 'Misleading',
      source_name: 'Viral Alert Telemetry',
      fact_check_publisher: 'Verified Fact-Check Stream',
      review_date: new Date().toISOString()
    };
    handleAnalyzeWithSatyaCheck(mockArticle);
  };

  const handleOpenFeedbackForArticle = (article: FactCheckArticle) => {
    setFeedbackInitialClaim(article.claim_text);
    setFeedbackModalOpen(true);
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Feed Data
  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await factCheckService.getFactChecks({
        page: currentPage,
        limit: 12,
        search: debouncedSearch,
        language: selectedLanguage,
        category: selectedCategory,
        verdict: selectedVerdict,
        sort: selectedSort
      });

      setArticles(res.fact_checks || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setLastRefreshedAt(new Date());

      // Also get sync status
      const statusRes = await factCheckService.getSyncStatus().catch(() => null);
      if (statusRes) {
        setSyncMeta(statusRes);
      }
    } catch (err) {
      console.error('Failed to load fact-check feed:', err);
      if (!silent) {
        toast.error('Could not load fact-check feed. Please try again.');
      }
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, debouncedSearch, selectedLanguage, selectedCategory, selectedVerdict, selectedSort]);

  // Initial and reactive load
  useEffect(() => {
    window.scrollTo(0, 0);
    loadFeed();
  }, [loadFeed]);

  // Automatic Background Refresh: Polls database every 60 seconds (silent update)
  useEffect(() => {
    const interval = setInterval(() => {
      loadFeed(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  // Format human-readable live update timestamp
  const formatLastUpdated = (date: Date) => {
    try {
      const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // First attempt to trigger background external sync if permitted
      const syncRes = await factCheckService.triggerRefresh().catch((err: any) => {
        if (err.statusCode === 429) {
          toast.info(err.message || 'Sync cooling down. Refreshing local feed.');
        }
        return null;
      });

      if (syncRes && syncRes.is_syncing) {
        toast.success('Live synchronization triggered. Updating feed...');
      }

      // Collect currently displayed card IDs to rotate fresh content
      const currentIds = articles.map((a) => a.id);
      currentIds.forEach((id) => seenArticleIdsRef.current.add(id));

      // If we have seen almost all available articles for this filter, reset seen tracking
      if (seenArticleIdsRef.current.size >= (totalCount > 12 ? totalCount - 6 : 1)) {
        seenArticleIdsRef.current.clear();
        currentIds.forEach((id) => seenArticleIdsRef.current.add(id));
      }

      const excludeList = Array.from(seenArticleIdsRef.current);
      const randomSeed = Math.random().toString(36).substring(2, 9);

      const res = await factCheckService.getFactChecks({
        page: 1,
        limit: 12,
        search: debouncedSearch,
        language: selectedLanguage,
        category: selectedCategory,
        verdict: selectedVerdict,
        sort: selectedSort,
        exclude_ids: excludeList.length > 0 ? excludeList : undefined,
        refresh: true,
        seed: randomSeed
      });

      let newItems = res.fact_checks || [];
      // Fallback if exclude list starved results
      if (newItems.length === 0) {
        seenArticleIdsRef.current.clear();
        const fallbackRes = await factCheckService.getFactChecks({
          page: 1,
          limit: 12,
          search: debouncedSearch,
          language: selectedLanguage,
          category: selectedCategory,
          verdict: selectedVerdict,
          sort: selectedSort,
          refresh: true,
          seed: randomSeed
        });
        newItems = fallbackRes.fact_checks || [];
      }

      const oldIdSet = new Set(currentIds);
      const hasRotated = newItems.some((item) => !oldIdSet.has(item.id)) || (newItems.length > 0 && newItems[0]?.id !== currentIds[0]);

      setArticles(newItems);
      setTotalCount(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setCurrentPage(1);
      setLastRefreshedAt(new Date());

      if (hasRotated) {
        toast.success('Feed refreshed with fresh rotated fact-checks.');
      } else {
        toast.info('Viewing all currently available fact-checks for this filter.');
      }
    } catch (err) {
      console.error('Failed to refresh feed:', err);
      toast.error('Failed to refresh feed. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger "Analyze with SatyaCheck"
  const handleAnalyzeWithSatyaCheck = async (article: FactCheckArticle) => {
    setAnalyzingArticle(article);
    setAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setMlResult(null);
    setMlError(null);

    try {
      const result = await detectNews(article.claim_text);
      setMlResult(result);
    } catch (err: any) {
      console.error('ML Analysis failed:', err);
      setMlError(err.message || 'Failed to complete model prediction.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Open Full Detail Modal
  const handleOpenDetail = (article: FactCheckArticle) => {
    setSelectedArticle(article);
    setDetailModalOpen(true);
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently verified';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 30) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins > 0) return `${diffMins}m ago`;
      return 'Just now';
    } catch {
      return 'Recently verified';
    }
  };

  // Verdict Badge Styling
  const renderVerdictBadge = (verdict: string, rawRating?: string) => {
    switch (verdict) {
      case 'False':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/40 px-2.5 py-1 text-xs font-mono font-bold text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>{rawRating || 'FALSE'}</span>
          </div>
        );
      case 'Misleading':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-xs font-mono font-bold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{rawRating || 'MISLEADING'}</span>
          </div>
        );
      case 'Partly False':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-950/40 px-2.5 py-1 text-xs font-mono font-bold text-orange-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{rawRating || 'PARTLY FALSE'}</span>
          </div>
        );
      case 'True':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{rawRating || 'VERIFIED TRUE'}</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-300">
            <Info className="h-3.5 w-3.5" />
            <span>{rawRating || 'UNRATED'}</span>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-zinc-100 selection:bg-zinc-800 selection:text-white">

      {/* ==================== Slim Left Icon Rail (#0D0D0D) ==================== */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col items-center justify-between border-r border-[#262626] bg-[#0D0D0D] py-4 select-none">
        <div className="flex flex-col items-center gap-6">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2B2B2B] bg-[#161616] text-white transition-all hover:bg-[#222222]"
            title="SatyaCheck Home"
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </Link>

          <div className="flex flex-col items-center gap-2">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[#1E1E1E] hover:text-white"
              title="Forensic Workstation"
            >
              <Cpu className="h-4 w-4" />
            </Link>

            <Link
              to="/feed"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#333333] bg-[#242424] text-white shadow-sm transition-colors"
              title="Live Fact-Check Feed"
            >
              <Newspaper className="h-4 w-4 text-white" />
            </Link>

            <Link
              to="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[#1E1E1E] hover:text-white"
              title="User Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>

            <Link
              to="/history"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[#1E1E1E] hover:text-white"
              title="Prediction History"
            >
              <History className="h-4 w-4" />
            </Link>

            <Link
              to="/account"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[#1E1E1E] hover:text-white"
              title="Account Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <Link
              to="/how-to-use"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[#1E1E1E] hover:text-white"
              title="How to Use SatyaCheck – User Guide"
            >
              <BookOpen className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* Notification Bell with unread dot */}
          <button
            type="button"
            onClick={() => {
              setAlertsModalOpen(true);
              setHasUnreadAlerts(false);
            }}
            title="Live Disinformation Alerts"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#1E1E1E] hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
            {hasUnreadAlerts && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Feedback / Message Bubble */}
          <button
            type="button"
            onClick={() => {
              setFeedbackInitialClaim('');
              setFeedbackModalOpen(true);
            }}
            title="Forensic Feedback"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#1E1E1E] hover:text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mt-1" title="Feed Connected" />
        </div>
      </aside>

      {/* ==================== Secondary Navigation Sidebar (#141414) ==================== */}
      <aside className="fixed inset-y-0 left-16 z-20 hidden w-64 flex-col justify-between border-r border-[#262626] bg-[#141414] p-4 lg:flex select-none">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#262626] pb-3">
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">SatyaCheck</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Live Fact-Check Feed</div>
            </div>
            <span className="rounded bg-zinc-100 dark:bg-[#1C1C1C] border border-zinc-300 dark:border-[#2B2B2B] px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              v2.4
            </span>
          </div>

          <div className="space-y-1.5 text-sm font-medium">
            <Link
              to="/"
              className="flex items-center justify-between rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-[#1C1C1C] hover:text-zinc-950 dark:hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Cpu className="h-4 w-4" />
                <span>Live ML Detector</span>
              </span>
            </Link>

            <Link
              to="/feed"
              className="flex items-center justify-between rounded-md border border-zinc-300 dark:border-[#333333] bg-zinc-200/90 dark:bg-[#242424] px-3 py-2 font-semibold text-zinc-950 dark:text-white shadow-xs"
            >
              <span className="flex items-center gap-3">
                <Newspaper className="h-4 w-4" />
                <span>Live Fact-Check Feed</span>
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center justify-between rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-[#1C1C1C] hover:text-zinc-950 dark:hover:text-white"
            >
              <span className="flex items-center gap-3">
                <LayoutDashboard className="h-4 w-4" />
                <span>User Dashboard</span>
              </span>
            </Link>

            <Link
              to="/history"
              className="flex items-center justify-between rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-[#1C1C1C] hover:text-zinc-950 dark:hover:text-white"
            >
              <span className="flex items-center gap-3">
                <History className="h-4 w-4" />
                <span>Prediction History</span>
              </span>
            </Link>

            <Link
              to="/account"
              className="flex items-center justify-between rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-[#1C1C1C] hover:text-zinc-950 dark:hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Profile & Security</span>
              </span>
            </Link>

            <Link
              to="/how-to-use"
              className="flex items-center justify-between rounded-md px-3 py-2 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-[#1C1C1C] hover:text-zinc-950 dark:hover:text-white"
            >
              <span className="flex items-center gap-3">
                <BookOpen className="h-4 w-4" />
                <span>User Guide</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-[#262626] pt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">SatyaCheck Forensics Lab</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Google API + IFCN Verified</div>
        </div>
      </aside>

      {/* ==================== Main Content Canvas ==================== */}
      <div className="flex min-w-0 flex-1 flex-col pl-16 lg:pl-80">

        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-[#262626] bg-white/95 dark:bg-[#141414]/90 px-4 sm:px-8 backdrop-blur-xl transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-bold text-zinc-900 dark:text-white">Live Fact-Check Feed</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auto-refresh: 60s</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAlertsModalOpen(true);
                setHasUnreadAlerts(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] text-zinc-300 hover:bg-[#222222] hover:text-white transition-colors"
              title="Live Disinformation Alerts"
            >
              <Bell className="h-4 w-4" />
              {hasUnreadAlerts && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFeedbackInitialClaim('');
                setFeedbackModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] text-zinc-300 hover:bg-[#222222] hover:text-white transition-colors"
              title="Forensic Feedback"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            <ThemeToggle />
            <LanguageToggle />
            <UserNav />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl">

          {/* Feed Title & Refresh Header */}
          <div className="border-b border-zinc-200 dark:border-[#262626] pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Latest Fact-Checks
                </h1>
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  Discover verified news and claims
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span>Last updated: {formatLastUpdated(lastRefreshedAt)}</span>
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/40 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Feed</span>
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalCount} Claims Indexed</span>
                </div>
              </div>

              {/* Refresh Feed Button (Top-Right) */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="btn-verify-claim h-10 gap-2 border border-zinc-300 dark:border-[#333333] bg-zinc-950 dark:bg-[#202020] hover:bg-zinc-800 dark:hover:bg-[#282828] text-white px-4 text-sm font-semibold transition-all shadow-sm disabled:opacity-50 rounded-lg"
                >
                  <RefreshCw className={`h-4 w-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="rounded-xl border border-zinc-200 dark:border-[#2B2B2B] bg-white dark:bg-[#1C1C1C] p-4 sm:p-5 space-y-4 shadow-xs">
            
            {/* Top Row: Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search verified claims, claimants, topics (e.g. RBI, WhatsApp, vaccine, election)..."
                className="h-11 pl-10 pr-10 border-zinc-300 dark:border-[#2B2B2B] bg-zinc-50 dark:bg-[#161616] text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Pills Grid */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-200 dark:border-[#262626] text-xs sm:text-sm font-medium">
              
              {/* Verdict Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-600 dark:text-zinc-400 font-semibold mr-1">Verdict:</span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'False', label: 'False / Fake', dot: 'bg-red-500' },
                  { key: 'Misleading', label: 'Misleading', dot: 'bg-amber-500' },
                  { key: 'Partly False', label: 'Partly False', dot: 'bg-orange-500' },
                  { key: 'True', label: 'True', dot: 'bg-emerald-500' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setSelectedVerdict(item.key); setCurrentPage(1); }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all text-xs sm:text-sm font-medium ${
                      selectedVerdict === item.key
                        ? 'border border-zinc-400 dark:border-[#333333] bg-zinc-950 text-white dark:bg-[#282828] font-bold shadow-xs'
                        : 'border border-transparent bg-zinc-100 dark:bg-[#161616] text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                    }`}
                  >
                    {item.dot && <span className={`h-2 w-2 rounded-full ${item.dot}`}></span>}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Language & Region Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Language Switch */}
                <div className="flex items-center rounded-lg border border-zinc-300 dark:border-[#2B2B2B] bg-zinc-100 dark:bg-[#161616] p-0.5">
                  <button
                    onClick={() => { setSelectedLanguage('all'); setCurrentPage(1); }}
                    className={`rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
                      selectedLanguage === 'all' ? 'bg-white dark:bg-[#282828] text-zinc-950 dark:text-white font-bold shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    All Lang
                  </button>
                  <button
                    onClick={() => { setSelectedLanguage('en'); setCurrentPage(1); }}
                    className={`rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
                      selectedLanguage === 'en' ? 'bg-white dark:bg-[#282828] text-zinc-950 dark:text-white font-bold shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                  <button
                    onClick={() => { setSelectedLanguage('hi'); setCurrentPage(1); }}
                    className={`rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
                      selectedLanguage === 'hi' ? 'bg-white dark:bg-[#282828] text-zinc-950 dark:text-white font-bold shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    🇮🇳 हिंदी
                  </button>
                </div>

                {/* Scope Switch */}
                <div className="flex items-center rounded-lg border border-zinc-300 dark:border-[#2B2B2B] bg-zinc-100 dark:bg-[#161616] p-0.5">
                  <button
                    onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                    className={`rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
                      selectedCategory === 'all' ? 'bg-white dark:bg-[#282828] text-zinc-950 dark:text-white font-bold shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => { setSelectedCategory('India'); setCurrentPage(1); }}
                    className={`rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
                      selectedCategory === 'India' ? 'bg-white dark:bg-[#282828] text-zinc-950 dark:text-white font-bold shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    🇮🇳 India
                  </button>
                </div>

                {/* Sort Toggle */}
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="rounded-lg border border-[#2B2B2B] bg-[#161616] px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

            </div>
          </div>

          {/* Fact-Check Feed Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-4 sm:p-5 space-y-4 animate-pulse"
                >
                  {/* Top metadata skeleton */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-[#262626]">
                    <div className="h-5 w-24 rounded bg-zinc-800"></div>
                    <div className="h-5 w-16 rounded bg-zinc-800"></div>
                  </div>
                  {/* 16:9 Image placeholder skeleton */}
                  <div className="aspect-[16/9] w-full rounded-lg bg-zinc-800"></div>
                  {/* Verdict badge skeleton */}
                  <div className="h-6 w-28 rounded-full bg-zinc-800"></div>
                  {/* Headline skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-zinc-800"></div>
                    <div className="h-4 w-4/5 rounded bg-zinc-800"></div>
                  </div>
                  {/* Claimed by skeleton */}
                  <div className="h-3 w-1/2 rounded bg-zinc-800"></div>
                  {/* Explanation box skeleton */}
                  <div className="h-12 w-full rounded-lg bg-zinc-800/60"></div>
                  {/* Actions & Analyze button skeleton */}
                  <div className="pt-3 border-t border-[#262626] space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 rounded bg-zinc-800"></div>
                      <div className="h-3 w-24 rounded bg-zinc-800"></div>
                    </div>
                    <div className="h-8 w-full rounded bg-zinc-800"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#2B2B2B] bg-[#161616]">
                <Newspaper className="h-6 w-6 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Fact-Checked Claims Found</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {searchQuery || selectedVerdict !== 'all' || selectedLanguage !== 'all'
                    ? 'No claims match your current filters. Try resetting search criteria or clearing filters.'
                    : 'The live feed is currently synchronizing with Google Fact Check Tools API and accredited Indian IFCN publishers.'}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                {(searchQuery || selectedVerdict !== 'all' || selectedLanguage !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedVerdict('all');
                      setSelectedLanguage('all');
                      setSelectedCategory('all');
                    }}
                    className="border-[#2B2B2B] bg-[#161616] text-xs font-mono text-zinc-200 hover:bg-[#222222]"
                  >
                    Clear All Filters
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="gap-2 bg-white text-zinc-950 font-mono text-xs font-semibold hover:bg-zinc-200"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Trigger Immediate Sync</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <NewsCard
                    article={item}
                    onOpenDetail={handleOpenDetail}
                    onAnalyze={handleAnalyzeWithSatyaCheck}
                    onFeedback={handleOpenFeedbackForArticle}
                    formatTimeAgo={formatTimeAgo}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#262626] pt-4 font-mono text-xs text-zinc-400">
              <div>
                Showing page {currentPage} of {totalPages} ({totalCount} verified claims)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="h-8 gap-1 border-[#2B2B2B] bg-[#161616] px-2.5 text-xs text-zinc-300 hover:bg-[#222222] hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <span className="px-2 text-zinc-200 font-bold">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="h-8 gap-1 border-[#2B2B2B] bg-[#161616] px-2.5 text-xs text-zinc-300 hover:bg-[#222222] hover:text-white"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== Full Details Modal ==================== */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl border-[#2B2B2B] bg-[#1C1C1C] p-6 text-zinc-100 shadow-2xl">
          {selectedArticle && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 border-b border-[#262626] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-[#2B2B2B] bg-[#161616] px-2.5 py-1 font-mono text-xs font-bold text-white">
                      {selectedArticle.fact_check_publisher}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Reviewed: {new Date(selectedArticle.review_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    {renderVerdictBadge(selectedArticle.normalized_verdict, selectedArticle.publisher_rating)}
                  </div>
                </div>
                <DialogTitle className="pt-2 text-lg font-bold text-white leading-snug">
                  Claim Investigation Details
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-zinc-400">
                  Cross-referenced ground truth from accredited forensic fact-checking consortium.
                </DialogDescription>
              </DialogHeader>

              {/* Large News Image in Full Details */}
              <div className="overflow-hidden rounded-lg">
                <NewsImage
                  src={selectedArticle.image_url}
                  alt={selectedArticle.claim_text}
                  category={selectedArticle.category}
                  publisher={selectedArticle.fact_check_publisher}
                  headline={selectedArticle.claim_text}
                />
              </div>

              {/* Claim Box */}
              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-4 space-y-2">
                <div className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
                  Original Claim Statement:
                </div>
                <p className="text-base font-semibold text-white leading-relaxed">
                  "{selectedArticle.claim_text}"
                </p>
                {selectedArticle.claimant && (
                  <div className="font-mono text-xs text-zinc-400">
                    <span className="text-zinc-500">Claimant: </span>
                    {selectedArticle.claimant}
                  </div>
                )}
              </div>

              {/* Forensic Debunk Explanation */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono font-semibold uppercase text-zinc-400">
                  Fact-Checker Findings & Evidence:
                </div>
                <p className="rounded-lg border border-[#262626] bg-[#161616] p-3 text-xs text-zinc-300 leading-relaxed">
                  {selectedArticle.explanation || 'No extended summary provided by publisher. Please refer to the full official investigative article linked below.'}
                </p>
              </div>

              {/* Metadata Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono sm:grid-cols-4">
                <div className="rounded border border-[#262626] bg-[#161616] p-2.5">
                  <div className="text-[10px] text-zinc-500 uppercase">Language</div>
                  <div className="font-bold text-white mt-0.5">{selectedArticle.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}</div>
                </div>
                <div className="rounded border border-[#262626] bg-[#161616] p-2.5">
                  <div className="text-[10px] text-zinc-500 uppercase">Region</div>
                  <div className="font-bold text-white mt-0.5">{selectedArticle.category}</div>
                </div>
                <div className="rounded border border-[#262626] bg-[#161616] p-2.5">
                  <div className="text-[10px] text-zinc-500 uppercase">Ingestion API</div>
                  <div className="font-bold text-white mt-0.5 truncate">{selectedArticle.source_api}</div>
                </div>
                <div className="rounded border border-[#262626] bg-[#161616] p-2.5">
                  <div className="text-[10px] text-zinc-500 uppercase">Sync Status</div>
                  <div className="font-bold text-emerald-400 mt-0.5">Verified & Saved</div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#262626] pt-4">
                <a
                  href={selectedArticle.fact_check_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-300 hover:text-white underline underline-offset-4"
                >
                  <span>Open Full Investigation on {selectedArticle.fact_check_publisher}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <Button
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleAnalyzeWithSatyaCheck(selectedArticle);
                  }}
                  className="gap-2 bg-white text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Analyze with SatyaCheck</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== "Analyze with SatyaCheck" Comparison Modal ==================== */}
      <Dialog open={analysisModalOpen} onOpenChange={setAnalysisModalOpen}>
        <DialogContent className="max-w-3xl border-[#2B2B2B] bg-[#1C1C1C] p-6 text-zinc-100 shadow-2xl max-h-[90vh] overflow-y-auto">
          {analyzingArticle && (
            <div className="space-y-6">
              
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#161616]">
                      <Sparkles className="h-4 w-4 text-white" />
                    </span>
                    <div>
                      <DialogTitle className="text-base font-bold text-white">
                        SatyaCheck Comparative Analysis
                      </DialogTitle>
                      <DialogDescription className="text-xs font-mono text-zinc-400">
                        Dual evaluation: Verified Journalism vs. Machine Learning Inference
                      </DialogDescription>
                    </div>
                  </div>
                  <span className="rounded bg-[#161616] border border-[#2B2B2B] px-2 py-1 font-mono text-[11px] text-zinc-300">
                    Dual Diagnostic View
                  </span>
                </div>
              </DialogHeader>

              {/* Analyzed Claim Banner */}
              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-4">
                <div className="text-[11px] font-mono font-semibold uppercase text-zinc-400 mb-1">
                  Claim Under Evaluation:
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  "{analyzingArticle.claim_text}"
                </p>
              </div>

              {/* Side-by-Side Dual Evaluation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Column 1: Ground Truth Fact-Check (Investigative Journalism) */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <div className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>1. Verified Investigation</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">External Source</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400">Publisher:</span>
                      <div className="font-bold text-white font-mono mt-0.5">
                        {analyzingArticle.fact_check_publisher}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-zinc-400">Official Verdict:</span>
                      <div className="mt-1">
                        {renderVerdictBadge(analyzingArticle.normalized_verdict, analyzingArticle.publisher_rating)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-zinc-400">Review Date:</span>
                      <div className="font-mono text-zinc-300 mt-0.5">
                        {new Date(analyzingArticle.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {analyzingArticle.explanation && (
                      <div className="pt-1">
                        <span className="text-[11px] font-mono text-zinc-400">Forensic Debunk:</span>
                        <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed line-clamp-4">
                          {analyzingArticle.explanation}
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <a
                        href={analyzingArticle.fact_check_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-300 hover:text-white underline underline-offset-4"
                      >
                        <span>View Publisher Proof Report</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Column 2: SatyaCheck Machine Learning Diagnostic */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <div className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-white" />
                      <span>2. SatyaCheck ML Classifier</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Algorithmic</span>
                  </div>

                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <p className="font-mono text-xs text-zinc-400">Running ML inference & TF-IDF vectors...</p>
                    </div>
                  ) : mlError ? (
                    <div className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                      {mlError}
                    </div>
                  ) : mlResult ? (
                    <div className="space-y-3 text-xs font-mono">
                      <div>
                        <span className="text-[11px] text-zinc-400">Model Classification:</span>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`rounded px-2.5 py-1 text-xs font-bold ${
                              mlResult.classification === 'fake'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : mlResult.classification === 'suspicious'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {mlResult.classification.toUpperCase()}
                          </span>
                          <span className="text-zinc-400 text-xs">
                            Confidence: {mlResult.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Authenticity Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-400">
                          <span>Authenticity Score:</span>
                          <span className="font-bold text-white">
                            {Math.round(mlResult.authenticityScore * 100)}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              mlResult.classification === 'fake'
                                ? 'bg-red-500'
                                : mlResult.classification === 'suspicious'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.round(mlResult.authenticityScore * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Top Linguistic Signals (XAI) */}
                      {mlResult.top_signals && mlResult.top_signals.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-zinc-400">Linguistic Influencers (XAI):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {mlResult.top_signals.slice(0, 4).map((sig, idx) => (
                              <span
                                key={idx}
                                className={`rounded border px-2 py-0.5 text-[10px] ${
                                  sig.impact === 'authentic'
                                    ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                                    : 'border-red-500/30 bg-red-950/40 text-red-300'
                                }`}
                              >
                                {sig.term} ({sig.weight > 0 ? `+${sig.weight}` : sig.weight})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-400 pt-1">
                        Language Model: {mlResult.language_name || 'English / Multilingual'}
                      </div>
                    </div>
                  ) : null}
                </div>

              </div>

              {/* Crucial Distinguishing Methodology Advisory Notice */}
              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                  <Info className="h-4 w-4 text-zinc-400" />
                  <span>Essential System Methodology Advisory:</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  The original fact-check verdict from <strong>{analyzingArticle.fact_check_publisher}</strong> represents manual human forensic journalism, investigative analysis, and official source corroboration. Conversely, the <strong>SatyaCheck ML Classifier</strong> computes statistical linguistic markers, clickbait sentiment, and vocabulary patterns. Statistical inference is complementary and does not replace empirical investigative evidence.
                </p>
              </div>

              {/* Close Action */}
              <div className="flex justify-end pt-2 border-t border-[#262626]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysisModalOpen(false)}
                  className="border-[#2B2B2B] bg-[#161616] text-xs font-mono text-zinc-300 hover:bg-[#222222] hover:text-white"
                >
                  Close Comparison
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Quick Action: Forensic Feedback */}
      <button
        type="button"
        title="Forensic Feedback & AI Assistant"
        onClick={() => {
          setFeedbackInitialClaim('');
          setFeedbackModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-[#161616] text-emerald-400 shadow-xl shadow-black/50 hover:bg-[#1F1F1F] hover:border-emerald-500 hover:scale-105 active:scale-95 transition-all"
      >
        <MessageSquare className="h-5 w-5 text-emerald-400" />
      </button>

      {/* Modals for Live Disinformation Alerts and Forensic Feedback */}
      <DisinformationAlertsModal
        open={alertsModalOpen}
        onOpenChange={setAlertsModalOpen}
        onAnalyzeClaim={handleAnalyzeClaimFromAlert}
        onMarkAllRead={() => setHasUnreadAlerts(false)}
      />

      <ForensicFeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
        initialClaim={feedbackInitialClaim}
      />

    </div>
  );
};

export default FactCheckFeed;
