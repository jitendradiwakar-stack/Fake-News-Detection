import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { HistoryService, DashboardStats, SavedPrediction } from '@/services/history';
import {
  RecommendationService,
  RecommendationItem,
  EducationalTip,
  CategoryItem
} from '@/services/recommendationService';
import { OnboardingModal } from '@/components/OnboardingModal';
import { NewsImage } from '@/components/NewsImage';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/UserNav';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  History,
  Trash2,
  PlusCircle,
  FileText,
  BarChart3,
  Calendar,
  ArrowRight,
  Loader2,
  Eye,
  Globe,
  Clock,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Newspaper,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Compass,
  Sliders,
  X,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Lightbulb,
  Radio,
  Share2,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Statistics states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<SavedPrediction | null>(null);

  // Recommendation states
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [trending, setTrending] = useState<RecommendationItem[]>([]);
  const [educationalTips, setEducationalTips] = useState<EducationalTip[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(user?.preferred_language || 'all');
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(true);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Trigger onboarding modal if user has not completed onboarding
  useEffect(() => {
    if (user && user.onboarding_completed === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
    loadRecommendations(selectedCategory, selectedLanguage);
  }, []);

  const loadDashboard = async () => {
    setIsLoadingStats(true);
    try {
      const data = await HistoryService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadRecommendations = async (cat: string, lang: string) => {
    setIsLoadingRecs(true);
    setRecsError(null);
    try {
      const data = await RecommendationService.getRecommendations({
        category: cat !== 'all' ? cat : undefined,
        language: lang !== 'all' ? lang : undefined,
        limit: 6
      });
      setRecommendations(data.recommended || []);
      setTrending(data.trending || []);
      setEducationalTips(data.educational_tips || []);
      setCategories(data.categories || []);
      setHasMore(data.pagination?.has_more ?? true);
      setLastRefreshedAt(new Date());
    } catch (error: any) {
      console.error('Failed to load recommendations:', error);
      const errMsg = error?.response?.data?.error || error?.message || 'Failed to load personalized recommendations.';
      setRecsError(errMsg);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleRefreshFeed = async () => {
    if (isRefreshing || isLoadingRecs) return;
    setIsRefreshing(true);
    try {
      const randomSeed = Math.random().toString(36).substring(2, 9);
      const currentIds = recommendations.map((r) => r.id);
      const data = await RecommendationService.refreshRecommendations({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
        limit: 6,
        seed: randomSeed,
        exclude_ids: currentIds
      });
      const newItems = data.recommended || [];
      const oldIds = new Set(currentIds);
      const hasFreshItems = newItems.some((r) => !oldIds.has(r.id));

      setRecommendations(newItems);
      setTrending(data.trending || []);
      setCategories(data.categories || []);
      setHasMore(data.pagination?.has_more ?? true);
      setLastRefreshedAt(new Date());
      setRecsError(null);

      if (hasFreshItems) {
        toast.success('Feed refreshed with new rotated fact-checks.');
      } else {
        toast.info('Viewing all currently available fact-checks for this topic.');
      }
    } catch (err: any) {
      console.error('Failed to refresh recommendations:', err);
      toast.error('Failed to refresh feed. Please try again.');
      if (recommendations.length === 0) {
        setRecsError(err?.response?.data?.error || err?.message || 'Failed to refresh recommendations.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const currentIds = recommendations.map((r) => r.id);
      const data = await RecommendationService.getRecommendations({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
        exclude_ids: currentIds,
        limit: 4
      });
      const newItems = data.recommended || [];
      if (newItems.length > 0) {
        setRecommendations((prev) => [...prev, ...newItems]);
        setHasMore(data.pagination?.has_more ?? false);
        toast.success(`Loaded ${newItems.length} more recommendations.`);
      } else {
        setHasMore(false);
        toast.info("You've reached the end of recommendations for this selection.");
      }
    } catch (err) {
      console.error('Failed to load more recommendations:', err);
      toast.error('Could not load more recommendations.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    loadRecommendations(categoryName, selectedLanguage);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    loadRecommendations(selectedCategory, lang);
  };

  const handleSaveArticle = async (item: RecommendationItem) => {
    try {
      await RecommendationService.recordInteraction(item.id, 'saved');
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === item.id ? { ...rec, is_saved: true } : rec))
      );
      toast.success('Claim saved to your reading bookmarks.');
    } catch {
      toast.error('Failed to save claim.');
    }
  };

  const handleDismissArticle = async (item: RecommendationItem) => {
    try {
      await RecommendationService.recordInteraction(item.id, 'dismissed');
      setRecommendations((prev) => prev.filter((rec) => rec.id !== item.id));
      toast.info('Item dismissed from recommendations.');
    } catch {
      toast.error('Failed to dismiss item.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await HistoryService.deletePrediction(id);
      toast.success('Record deleted from history.');
      if (selectedRecord?.id === id) setSelectedRecord(null);
      loadDashboard();
    } catch {
      toast.error('Failed to delete record.');
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'No activity yet';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const getVerdictBadge = (verdict: string) => {
    const v = (verdict || '').toLowerCase();
    if (v.includes('false')) {
      return {
        label: verdict,
        badgeClass: 'border-rose-500/40 bg-rose-950/30 text-rose-400'
      };
    }
    if (v.includes('misleading') || v.includes('partly')) {
      return {
        label: verdict,
        badgeClass: 'border-amber-500/40 bg-amber-950/30 text-amber-400'
      };
    }
    if (v.includes('true')) {
      return {
        label: verdict,
        badgeClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
      };
    }
    return {
      label: verdict,
      badgeClass: 'border-zinc-700 bg-zinc-800 text-zinc-300'
    };
  };

  const isNewUser = (stats?.total_analyses ?? 0) === 0;

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100">
      
      {/* First-Time User Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          loadDashboard();
          loadRecommendations(selectedCategory, selectedLanguage);
        }}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#141414]/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 font-bold shadow-sm">
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-mono text-sm font-bold text-white tracking-tight">SatyaCheck</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/feed">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222] flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live Feed</span>
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm" className="hidden sm:flex gap-1.5 bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 shadow-sm">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Analysis</span>
              </Button>
            </Link>
            <Link to="/history">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                History
              </Button>
            </Link>
            <Link to="/account">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                Settings
              </Button>
            </Link>
            <ThemeToggle />
            <LanguageToggle />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#2B2B2B] bg-[#161616] font-mono text-lg font-bold text-white shadow-sm">
                {userInitials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-[#2E2E2E] bg-[#161616] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                    Investigator Workspace
                  </span>
                  {user?.onboarding_completed && (
                    <span className="rounded border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                      Profile Active
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {getGreeting()}, {user?.full_name || 'Investigator'}! Welcome to SatyaCheck.
                </h1>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  Discover verified fact-checks, monitor emerging misinformation, and inspect tailored recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOnboarding(true)}
                className="gap-1.5 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-300 hover:text-white hover:bg-[#222222]"
              >
                <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                <span>Customize Topics</span>
              </Button>
              <Link to="/feed">
                <Button variant="outline" className="gap-1.5 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                  <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live Feed</span>
                </Button>
              </Link>
              <Link to="/">
                <Button className="gap-2 bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 shadow-sm">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Analyze Claim</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Start Your First Analysis CTA (Prominently featured for first-time or active users) */}
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-[#1C1C1C] to-[#1C1C1C] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                <Sparkles className="h-3 w-3" />
                <span>Instant Forensic Verification</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Start Your First News Analysis
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Paste any viral message, breaking news claim, or article link into the ML detector. SatyaCheck cross-references vocabulary patterns with 40+ trusted national &amp; global news portals.
              </p>
            </div>

            <Link to="/">
              <Button className="gap-2 bg-emerald-500 text-zinc-950 text-xs font-bold hover:bg-emerald-400 shadow-md">
                <PlusCircle className="h-4 w-4" />
                <span>Analyze Your First News</span>
              </Button>
            </Link>
          </div>

          {/* Quick-test specimen prompts */}
          <div className="pt-2 border-t border-[#262626]">
            <span className="font-mono text-[11px] text-zinc-400 mr-2">Try sample claims:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/?claim=NASA spacecraft confirms presence of water ice beneath Martian surface')}
                className="rounded-lg border border-[#2B2B2B] bg-[#161616] px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-500/50 hover:text-white transition-colors text-left"
              >
                🔬 <span className="font-mono text-[11px] text-zinc-400">EN:</span> NASA Mars Ice Claim
              </button>
              <button
                onClick={() => navigate('/?claim=सोशल मीडिया पर दावा किया जा रहा है कि केंद्र सरकार सभी छात्रों को फ्री लैपटॉप दे रही है')}
                className="rounded-lg border border-[#2B2B2B] bg-[#161616] px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-500/50 hover:text-white transition-colors text-left"
              >
                🇮🇳 <span className="font-mono text-[11px] text-zinc-400">हिंदी:</span> मुफ्त लैपटॉप योजना दावा
              </button>
              <button
                onClick={() => navigate('/?claim=Viral WhatsApp forward says RBI 500 note contains GPS nano chip')}
                className="rounded-lg border border-[#2B2B2B] bg-[#161616] px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-500/50 hover:text-white transition-colors text-left"
              >
                💬 <span className="font-mono text-[11px] text-zinc-400">Hinglish:</span> RBI ₹500 note GPS forward
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: Recommended for You */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Recommended for You
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tailored fact-checks and investigations dynamically rotated based on your topics and language.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Last Refreshed Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                <Clock className="h-3 w-3 text-zinc-400" />
                <span>Refreshed: {formatTime(lastRefreshedAt)}</span>
              </div>

              {/* Refresh Feed Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshFeed}
                disabled={isRefreshing || isLoadingRecs}
                className="gap-1.5 border-[#2E2E2E] bg-[#161616] text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#242424] h-8 px-3 shadow-sm"
              >
                <RotateCcw className={`h-3.5 w-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
              </Button>

              {/* Language Switcher for recommendations */}
              <div className="flex items-center gap-1.5 bg-[#161616] border border-[#2B2B2B] p-1 rounded-lg font-mono text-[11px]">
                {['all', 'en', 'hi'].map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    className={`px-2.5 py-0.5 rounded transition-colors ${
                      selectedLanguage === l
                        ? 'bg-[#262626] text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {l === 'all' ? 'All Lang' : l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Explore All Categories Chips */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
              <Compass className="h-3 w-3 text-zinc-400" />
              <span>Explore Categories:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-white text-zinc-950 font-bold'
                    : 'border border-[#2B2B2B] bg-[#161616] text-zinc-400 hover:text-white'
                }`}
              >
                All Topics
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-white text-zinc-950 font-bold'
                      : 'border border-[#2B2B2B] bg-[#161616] text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.name} {cat.count > 0 && <span className="opacity-60 text-[10px]">({cat.count})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Articles Grid */}
          {recsError ? (
            <div className="rounded-xl border border-rose-900/30 bg-[#1A1415] p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-zinc-100">Unable to load recommendations</h4>
                <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">{recsError}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRecsError(null);
                  loadRecommendations(selectedCategory, selectedLanguage);
                }}
                className="text-xs border-[#2B2B2B] bg-[#202020] hover:bg-[#282828] text-zinc-200 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                <span>Retry Loading Recommendations</span>
              </Button>
            </div>
          ) : isLoadingRecs ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-[#242424] rounded w-1/3"></div>
                    <div className="h-4 bg-[#242424] rounded w-16"></div>
                  </div>
                  <div className="aspect-[16/9] w-full bg-[#242424] rounded-lg"></div>
                  <div className="h-5 bg-[#242424] rounded w-full"></div>
                  <div className="h-5 bg-[#242424] rounded w-4/5"></div>
                  <div className="h-3 bg-[#242424] rounded w-1/2 pt-2"></div>
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] py-12 text-center space-y-3">
              <Compass className="mx-auto h-8 w-8 text-zinc-500" />
              <p className="text-xs font-mono text-zinc-400">
                No matching fact-checks found in this category.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCategoryChange('all')}
                className="text-xs border-[#2B2B2B] bg-[#202020] text-zinc-200"
              >
                Show All Recommendations
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {recommendations.map((item) => {
                const badge = getVerdictBadge(item.normalized_verdict);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 transition-all hover:border-[#383838]"
                  >
                    <div className="space-y-3">
                      {/* Top Match Tag & Verdict */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-[#202020] border border-[#2E2E2E] px-2 py-0.5 font-mono text-[10px] text-emerald-400 font-semibold">
                          <Sparkles className="h-3 w-3" />
                          <span>{item.match_reason || 'Personalized Match'}</span>
                        </span>

                        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Large News Image */}
                      <div>
                        <NewsImage
                          src={item.image_url}
                          alt={item.claim_text}
                          category={item.category}
                          publisher={item.fact_check_publisher}
                          headline={item.claim_text}
                        />
                      </div>

                      {/* Claim Text */}
                      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-3">
                        {item.claim_text}
                      </h3>

                      {/* Publisher & Metadata */}
                      <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-300 truncate">
                          {item.fact_check_publisher}
                        </span>
                        <span>•</span>
                        <span>{formatDate(item.review_date)}</span>
                        <span>•</span>
                        <span className="uppercase">{item.language}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#242424] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/?claim=${encodeURIComponent(item.claim_text)}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Analyze with SatyaCheck</span>
                        </button>

                        {item.fact_check_url && (
                          <a
                            href={item.fact_check_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors px-1"
                            title="Open Fact-Check Article"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveArticle(item)}
                          className={`p-1.5 rounded hover:bg-[#222222] transition-colors ${
                            item.is_saved ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title={item.is_saved ? 'Saved' : 'Save Bookmark'}
                        >
                          {item.is_saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDismissArticle(item)}
                          className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-[#222222] transition-colors"
                          title="Dismiss Recommendation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button & Pagination Controls */}
          {recommendations.length > 0 && (
            <div className="pt-4 border-t border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Showing {recommendations.length} recommendations</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">Auto-rotated for freshness</span>
              </div>

              {hasMore ? (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="gap-2 border-[#2E2E2E] bg-[#161616] text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#222222] px-4 py-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      <span>Loading More...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Load More Recommendations</span>
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>You've reviewed all available recommendations for this selection.</span>
                  <button
                    onClick={handleRefreshFeed}
                    className="text-emerald-400 hover:underline font-semibold ml-1"
                  >
                    Refresh feed &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION: Trending Fact-Checks */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Trending Verified Claims
              </h2>
            </div>
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="font-mono text-xs text-zinc-400 hover:text-white hover:bg-[#242424] gap-1">
                <span>View Full Feed</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trending.slice(0, 6).map((item) => {
              const badge = getVerdictBadge(item.normalized_verdict);
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#262626] bg-[#161616] p-3.5 space-y-2 hover:border-[#383838] transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-400 truncate max-w-[140px] font-semibold">
                        {item.fact_check_publisher}
                      </span>
                      <span className={`rounded border px-1.5 py-0.2 font-bold uppercase ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200 line-clamp-2">
                      {item.claim_text}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                    <span>{formatDate(item.review_date)}</span>
                    <button
                      onClick={() => navigate(`/?claim=${encodeURIComponent(item.claim_text)}`)}
                      className="text-zinc-300 hover:text-emerald-400 font-semibold"
                    >
                      Check Claim &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: Learn How to Identify Fake News */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Learn How to Identify Fake News &amp; Misinformation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {educationalTips.map((tip) => (
              <div
                key={tip.id}
                className="rounded-xl border border-[#282828] bg-[#161616] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#202020] border border-[#2E2E2E] px-2 py-0.5 font-mono text-[10px] text-emerald-400 font-semibold">
                    {tip.badge}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">
                  {tip.title}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {tip.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: Personal Forensic Metrics */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Your Personal Verification Metrics
              </h2>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              Account telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Card 1: Total Analyses */}
            <div className="rounded-xl border border-[#282828] bg-[#161616] p-4">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                <span>Total Analyses</span>
                <FileText className="h-4 w-4 text-zinc-300" />
              </div>
              <div className="mt-3 font-mono text-2xl font-bold text-white">
                {isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : stats?.total_analyses ?? 0}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">
                Verified &amp; saved in DB
              </div>
            </div>

            {/* Card 2: Authentic Claims */}
            <div className="rounded-xl border border-[#282828] bg-[#161616] p-4">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                <span>Authentic Claims</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3 font-mono text-2xl font-bold text-emerald-400">
                {isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : stats?.authentic_count ?? 0}
              </div>
              <div className="mt-1 font-mono text-[10px] text-emerald-400/80">
                {stats?.authentic_percentage ?? 0}% of all checked
              </div>
            </div>

            {/* Card 3: Fake Misinformation */}
            <div className="rounded-xl border border-[#282828] bg-[#161616] p-4">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                <span>Fake / Misinfo</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-3 font-mono text-2xl font-bold text-rose-400">
                {isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : stats?.fake_count ?? 0}
              </div>
              <div className="mt-1 font-mono text-[10px] text-rose-400/80">
                {stats?.fake_percentage ?? 0}% of all checked
              </div>
            </div>

            {/* Card 4: Suspicious Claims */}
            <div className="rounded-xl border border-[#282828] bg-[#161616] p-4">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                <span>Suspicious Claims</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-3 font-mono text-2xl font-bold text-amber-400">
                {isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : stats?.suspicious_count ?? 0}
              </div>
              <div className="mt-1 font-mono text-[10px] text-amber-500/80">
                Low-confidence alerts
              </div>
            </div>

            {/* Card 5: Recent Activity Timestamp */}
            <div className="rounded-xl border border-[#282828] bg-[#161616] p-4">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                <span>Recent Activity</span>
                <Clock className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="mt-3 text-xs font-mono font-semibold text-zinc-200 truncate" title={stats?.recent_activity || ''}>
                {isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : formatDate(stats?.recent_activity)}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-500">
                Last prediction recorded
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Recent Prediction Activity Log */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-zinc-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Recent Prediction Activity Log
              </h2>
            </div>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="gap-1 font-mono text-xs text-zinc-400 hover:text-white hover:bg-[#242424]">
                <span>View All History</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {isLoadingStats ? (
            <div className="flex py-12 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : !stats?.recent_analyses || stats.recent_analyses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#2B2B2B] bg-[#161616] text-zinc-400">
                <FileText className="h-6 w-6" />
              </div>
              <p className="font-mono text-xs text-zinc-400">No predictions recorded yet in database.</p>
              <Link to="/">
                <Button size="sm" className="bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950">
                  Analyze Your First Claim
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#262626]">
              {stats.recent_analyses.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#222222] p-2.5 rounded-lg transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          item.predicted_label === 'fake'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : item.predicted_label === 'suspicious'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.predicted_label}
                      </span>

                      <span className="rounded bg-[#161616] border border-[#2B2B2B] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                        {item.input_type === 'url' ? 'URL' : 'TEXT'}
                      </span>

                      <span className="font-mono text-[10px] text-zinc-400">
                        {item.detected_language ? item.detected_language.toUpperCase() : 'EN'} • {item.confidence}% Confidence
                      </span>

                      <span className="font-mono text-[10px] text-zinc-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-zinc-200 line-clamp-1">
                      {item.headline || item.input_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecord(item)}
                      className="h-7 gap-1 border-[#2E2E2E] bg-[#161616] px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-[#242424]"
                    >
                      <Eye className="h-3 w-3 text-zinc-300" />
                      <span>Details</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-400 hover:bg-[#222222]"
                      title="Delete Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Record Details Modal Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-xl border-[#2B2B2B] bg-[#1C1C1C] p-6 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm font-bold text-white flex items-center justify-between">
              <span>Prediction Record Details</span>
              {selectedRecord && (
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    selectedRecord.predicted_label === 'fake'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : selectedRecord.predicted_label === 'suspicious'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedRecord.predicted_label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 pt-2 font-mono text-xs">
              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-3 space-y-1">
                <span className="text-[10px] uppercase text-zinc-400">Analyzed Claim / Article</span>
                <p className="text-zinc-100 font-sans text-sm font-medium leading-relaxed">
                  {selectedRecord.headline || selectedRecord.input_text}
                </p>
                {selectedRecord.headline && selectedRecord.input_text !== selectedRecord.headline && (
                  <p className="text-[11px] text-zinc-400 break-all">{selectedRecord.input_text}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2.5">
                  <span className="text-[10px] text-zinc-400 uppercase">Authenticity Probability</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {Math.round(selectedRecord.authenticity_score * 100)}%
                  </p>
                </div>

                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2.5">
                  <span className="text-[10px] text-zinc-400 uppercase">Model Confidence</span>
                  <p className="text-base font-bold text-zinc-200 mt-0.5">
                    {selectedRecord.confidence}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2">
                  <span className="text-zinc-400">Language:</span>{' '}
                  <span className="text-zinc-200 font-semibold">{selectedRecord.detected_language?.toUpperCase() || 'EN'}</span>
                </div>
                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2">
                  <span className="text-zinc-400">Input Type:</span>{' '}
                  <span className="text-zinc-200 font-semibold">{selectedRecord.input_type.toUpperCase()}</span>
                </div>
              </div>

              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Recorded: {formatDate(selectedRecord.created_at)}</span>
                <span>{selectedRecord.model_version}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
