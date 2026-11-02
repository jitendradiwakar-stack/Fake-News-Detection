import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  History,
  Info,
  Cpu,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Menu,
  FileText,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Globe,
  Search,
  PlusCircle,
  LayoutDashboard,
  Database,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Clock,
  Trash2,
  Newspaper,
  X,
  Code2,
  GitBranch,
  Sliders,
  ChevronDown,
  ArrowRight,
  Bell,
  MessageSquare,
  Compass,
  Terminal,
  Radio,
  PanelLeftClose,
  MoreHorizontal,
  Share2,
  Check,
  Zap,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NewsInput } from '@/components/NewsInput';
import { ResultCard } from '@/components/ResultCard';
import { DeepfakeForensicsSection } from '@/components/DeepfakeForensicsSection';
import { DisinformationAlertsModal } from '@/components/DisinformationAlertsModal';
import { ForensicFeedbackModal } from '@/components/ForensicFeedbackModal';
import {
  DetectionResult,
  detectNews,
  getRecentEnquiries,
  deleteEnquiry
} from '@/services/detection';
import { toast } from 'sonner';

export const Index: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [activeMode, setActiveMode] = useState<'news' | 'deepfake' | 'recent' | 'benchmarks'>('news');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<DetectionResult[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChecklistStep, setActiveChecklistStep] = useState<number>(2);

  // Modals for Disinformation Alerts and Forensic Feedback
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const claimInputSectionRef = useRef<HTMLDivElement>(null);

  const handleAnalyzeClaimFromAlert = (claimText: string) => {
    setActiveMode('news');
    handleSubmit(claimText);
    claimInputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadRecentEnquiries();

    // Listen for '/' key to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadRecentEnquiries = async () => {
    try {
      const enquiries = await getRecentEnquiries();
      setRecentEnquiries(enquiries);
    } catch (error) {
      console.error('Failed to load recent enquiries:', error);
    }
  };

  const handleSubmit = async (input: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const detectionResult = await detectNews(input);
      setResult(detectionResult);
      await loadRecentEnquiries();

      if (detectionResult.classification === 'fake') {
        toast.error(t('result.fake'));
      } else if (detectionResult.classification === 'suspicious') {
        toast.warning(t('result.suspicious'));
      } else {
        toast.success(t('result.real'));
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to connect to ML Backend. Make sure server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEnquiry = (enquiry: DetectionResult) => {
    setActiveMode('news');
    setResult(enquiry);
    setIsMobileSidebarOpen(false);
    claimInputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteEnquiry = (id: string) => {
    const updated = deleteEnquiry(id);
    setRecentEnquiries(updated);
    toast.success('Query deleted from history');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
  };

  const handleVerifyNewClaimClick = () => {
    setActiveMode('news');
    claimInputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'JD';

  const userName = user?.full_name ? user.full_name.split(' ')[0] : 'Investigator';

  // Filtered recent checks for search
  const filteredRecent = recentEnquiries.filter((item) =>
    searchQuery
      ? (item.headline || item.input).toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Column 1: Far-Left Slim Icon Rail (Pure Charcoal/Obsidian #0D0D0D)
  const SlimRailContent = () => (
    <div className="flex h-full w-14 flex-col items-center justify-between bg-[#0D0D0D] py-3 text-zinc-400 border-r border-[#262626]">
      {/* Top Brand Squircle */}
      <div className="flex flex-col items-center gap-4">
        <Link
          to="/"
          title="SatyaCheck Home"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950 shadow-md hover:bg-zinc-200 transition-all font-bold"
        >
          <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
        </Link>

        {/* Action Icon Rail */}
        <div className="flex flex-col items-center gap-1.5 pt-2">
          <button
            onClick={() => setActiveMode('news')}
            title="Verify Claim / Incidents"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              activeMode === 'news'
                ? 'bg-[#222222] text-white border border-[#333333]'
                : 'hover:bg-[#1C1C1C] hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveMode('deepfake')}
            title="Deepfake Forensics"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              activeMode === 'deepfake'
                ? 'bg-[#222222] text-white border border-[#333333]'
                : 'hover:bg-[#1C1C1C] hover:text-zinc-200'
            }`}
          >
            <Video className="h-4 w-4" />
          </button>

          <Link
            to="/history"
            title="Database History"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#1C1C1C] hover:text-zinc-200 transition-colors"
          >
            <Database className="h-4 w-4" />
          </Link>

          <Link
            to="/feed"
            title="Live Fact-Check Feed"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            <Newspaper className="h-4 w-4" />
          </Link>

          <Link
            to="/dashboard"
            title="Personal Dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#1C1C1C] hover:text-zinc-200 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Bottom Slim Rail Icons */}
      <div className="flex flex-col items-center gap-2">
        {/* Notification Bell with unread dot */}
        <button
          type="button"
          onClick={() => {
            setAlertsModalOpen(true);
            setHasUnreadAlerts(false);
          }}
          title="Live Disinformation Alerts"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#1C1C1C] hover:text-white transition-colors"
        >
          <Bell className="h-4 w-4" />
          {hasUnreadAlerts && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        {/* Feedback / Message Bubble */}
        <button
          type="button"
          onClick={() => setFeedbackModalOpen(true)}
          title="Forensic Feedback"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#1C1C1C] hover:text-white transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        {/* How to Use SatyaCheck – User Guide */}
        <Link
          to="/how-to-use"
          title="How to Use SatyaCheck – User Guide"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#1C1C1C] hover:text-white transition-colors"
        >
          <BookOpen className="h-4 w-4" />
        </Link>

        {/* Smooth Theme Toggle */}
        <ThemeToggle variant="rail" />

        {/* User Avatar with Presence Dot */}
        <Link
          to={isAuthenticated ? "/account" : "/login"}
          title={isAuthenticated ? user?.full_name : "Log in"}
          className="relative mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-xs font-mono font-bold text-white hover:ring-2 hover:ring-zinc-400 transition-all"
        >
          {userInitials}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0D0D0D]"></span>
        </Link>
      </div>
    </div>
  );

  // Column 2: Navigation Sidebar (#141414 with #161616 elements)
  const NavigationSidebarContent = () => (
    <div className="flex h-full w-56 flex-col justify-between bg-[#141414] text-zinc-300 border-r border-[#262626]">
      {/* Top Header */}
      <div>
        <div className="flex h-14 items-center justify-between px-4 border-b border-[#262626]">
          <span className="text-sm font-bold text-white tracking-tight">SatyaCheck</span>
          <button
            title="Sidebar layout"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation List Items */}
        <div className="space-y-1 px-2.5 py-3 text-xs">
          
          {/* 1. Incidents / Claims */}
          <button
            onClick={() => { setActiveMode('news'); setIsMobileSidebarOpen(false); }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
              activeMode === 'news'
                ? 'bg-[#242424] text-white font-semibold border border-[#333333]'
                : 'text-zinc-300 hover:bg-[#1C1C1C] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Verify Claim</span>
            </div>
            <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-rose-400">
              1
            </span>
          </button>

          {/* 2. Deepfake Forensics */}
          <button
            onClick={() => { setActiveMode('deepfake'); setIsMobileSidebarOpen(false); }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
              activeMode === 'deepfake'
                ? 'bg-[#242424] text-white font-semibold border border-[#333333]'
                : 'text-zinc-300 hover:bg-[#1C1C1C] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Video className="h-4 w-4 text-zinc-300" />
              <span>Deepfake Forensics</span>
            </div>
            <span className="rounded bg-[#1C1C1C] px-1.5 py-0.2 font-mono text-[9px] text-zinc-400 border border-[#2B2B2B]">
              68-Pt
            </span>
          </button>

          {/* 3. Recent Checks */}
          <button
            onClick={() => { setActiveMode('recent'); setIsMobileSidebarOpen(false); }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
              activeMode === 'recent'
                ? 'bg-[#242424] text-white font-semibold border border-[#333333]'
                : 'text-zinc-300 hover:bg-[#1C1C1C] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-amber-400" />
              <span>Recent Checks</span>
            </div>
            {recentEnquiries.length > 0 && (
              <span className="rounded-full bg-[#1C1C1C] px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-300 border border-[#2B2B2B]">
                {recentEnquiries.length}
              </span>
            )}
          </button>

          {/* 4. Live Fact-Check Feed */}
          <Link
            to="/feed"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-zinc-300 hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Newspaper className="h-4 w-4 text-emerald-400" />
              <span>Live Fact-Check Feed</span>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[10px] text-zinc-400">LIVE</span>
            </span>
          </Link>

          {/* 5. Heartbeats / Pipelines */}
          <button
            onClick={() => { setActiveMode('benchmarks'); setIsMobileSidebarOpen(false); }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-colors ${
              activeMode === 'benchmarks'
                ? 'bg-[#242424] text-white font-semibold border border-[#333333]'
                : 'text-zinc-300 hover:bg-[#1C1C1C] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="h-4 w-4 text-zinc-300" />
              <span>Heartbeats &amp; ML</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">99.7%</span>
          </button>

          {/* 6. Personal Dashboard */}
          <Link
            to="/dashboard"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-zinc-300 hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="h-4 w-4 text-zinc-300" />
              <span>Personal Dashboard</span>
            </div>
          </Link>

          {/* 7. Full History */}
          <Link
            to="/history"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-zinc-300 hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-zinc-300" />
              <span>Full Audit History</span>
            </div>
          </Link>

          {/* 8. Integrations */}
          <div className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-zinc-400 hover:bg-[#1C1C1C] hover:text-zinc-200 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-zinc-400" />
              <span>Integrations</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          </div>

          {/* 9. About System */}
          <Link
            to="/about"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-zinc-300 hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-zinc-300" />
              <span>About SatyaCheck</span>
            </div>
          </Link>

        </div>
      </div>

      {/* Bottom Profile & Language Bar */}
      <div className="border-t border-[#262626] p-3 space-y-3">
        {/* Theme Mode selector */}
        <div className="flex items-center justify-between px-1 text-xs font-mono text-zinc-400">
          <span>Theme</span>
          <ThemeToggle variant="labeled" />
        </div>

        {/* Language selector */}
        <div className="flex items-center justify-between px-1 text-xs font-mono text-zinc-400">
          <span>Locale</span>
          <LanguageToggle />
        </div>

        {/* User authentication shortcut */}
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between rounded-lg bg-[#161616] border border-[#2B2B2B] p-2">
            <div className="min-w-0 pr-1">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] font-mono text-zinc-400 truncate">@{user.username}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/account" title="Account settings">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-[#242424]">
                  <Settings className="h-3 w-3" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-6 w-6 p-0 text-zinc-400 hover:text-rose-400 hover:bg-[#242424]"
                title="Log out"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Link to="/login" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-1.5 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-300 hover:text-white hover:bg-[#222222]"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In</span>
              </Button>
            </Link>
            <Link to="/signup" className="block">
              <Button
                size="sm"
                className="w-full justify-center gap-1.5 bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Sign Up</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex">
      
      {/* 1. Desktop Dual-Column Left Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 shadow-lg">
        <SlimRailContent />
        <NavigationSidebarContent />
      </aside>

      {/* Mobile Drawer (Combines Rail & Sidebar) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 border-[#262626] bg-[#141414] flex w-72">
          <SlimRailContent />
          <div className="flex-1">
            <NavigationSidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* 2. Main Workspace Canvas (#121212) */}
      <div className="flex-1 lg:pl-[280px] flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-zinc-200 dark:border-[#262626] bg-white/90 dark:bg-[#121212]/95 px-6 sm:px-10 backdrop-blur-md transition-colors">
          
          {/* Left: Hamburger for mobile + Greeting */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1C1C1C]"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              How is it going, {userName}?
            </h1>
          </div>

          {/* Center/Right: Search bar & Primary Action Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input with [/] shortcut */}
            <div className="hidden md:flex items-center relative w-72 lg:w-96">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims, topics, analyses..."
                className="w-full rounded-lg border border-zinc-300/80 dark:border-[#2B2B2B] bg-zinc-100/90 dark:bg-[#161616] pl-9 pr-9 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-[#1A1A1A] focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400/30 transition-all shadow-sm"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-2 rounded border border-zinc-300 dark:border-[#2E2E2E] bg-zinc-200/90 dark:bg-[#222222] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 shadow-xs pointer-events-none">
                  /
                </span>
              )}
            </div>

            {/* Smooth Theme Toggle */}
            <ThemeToggle />

            {/* Primary Action Button */}
            <button
              onClick={handleVerifyNewClaimClick}
              className="btn-verify-claim flex items-center gap-2 rounded-lg bg-zinc-950 dark:bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-zinc-950 shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex-shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Verify a new claim</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 px-6 py-6 sm:px-10 space-y-8 max-w-6xl w-full mx-auto">
          
          {/* Subheader Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-[#262626] pb-3 text-xs font-medium text-zinc-400">
            <button
              onClick={() => setActiveMode('news')}
              className={`flex items-center gap-2 transition-colors ${
                activeMode === 'news'
                  ? 'text-white font-semibold border-b-2 border-white pb-3 -mb-3.5'
                  : 'hover:text-zinc-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Claims &amp; Verification</span>
            </button>

            <Link
              to="/feed"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
              <span>Live Fact-Check Feed</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </Link>

            <button
              onClick={() => setActiveMode('deepfake')}
              className={`flex items-center gap-2 transition-colors ${
                activeMode === 'deepfake'
                  ? 'text-white font-semibold border-b-2 border-white pb-3 -mb-3.5'
                  : 'hover:text-zinc-200'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Deepfake Video Forensics</span>
            </button>

            <button
              onClick={() => setActiveMode('recent')}
              className={`flex items-center gap-2 transition-colors ${
                activeMode === 'recent'
                  ? 'text-white font-semibold border-b-2 border-white pb-3 -mb-3.5'
                  : 'hover:text-zinc-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Audit Feed ({recentEnquiries.length})</span>
            </button>

            <button
              onClick={() => setActiveMode('benchmarks')}
              className={`flex items-center gap-2 transition-colors ${
                activeMode === 'benchmarks'
                  ? 'text-white font-semibold border-b-2 border-white pb-3 -mb-3.5'
                  : 'hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Model Heartbeats</span>
            </button>
          </div>

          {/* Active Workspace: Claims & Verification Mode */}
          {activeMode === 'news' && (
            <div className="space-y-6">
              {/* Claim Input Box Container */}
              <div ref={claimInputSectionRef}>
                <NewsInput
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  initialValue={searchParams.get('claim') || ''}
                />
              </div>

              {/* Forensic Result Card */}
              {result && <ResultCard result={result} />}

              {/* Verified Incidents / Claims Table */}
              <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-medium text-zinc-400 border-b border-[#262626]">
                  <div className="col-span-6 sm:col-span-7">Incident / Claim</div>
                  <div className="col-span-3 sm:col-span-3">Started at</div>
                  <div className="col-span-3 sm:col-span-2 text-right sm:text-left">Status / Verdict</div>
                </div>

                {/* Table Incident Rows */}
                <div className="divide-y divide-[#262626] text-xs">
                  
                  {/* Row 1: NASA claim */}
                  <div
                    onClick={() => handleSubmit('NASA confirms discovery of ancient microbial life fossils on Mars surface.')}
                    className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-[#222222] cursor-pointer transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25">
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">NASA confirms microbial life fossils on Mars surface</p>
                        <p className="text-[11px] text-zinc-400 truncate">TF-IDF Vectorizer (12k features) • High Disinformation Risk</p>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-zinc-400 text-[11px]">
                      1 day ago
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end sm:justify-between">
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                        <span>Fake (94%)</span>
                      </span>
                      <button className="hidden sm:block text-zinc-500 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Hindi Laptop Scheme */}
                  <div
                    onClick={() => handleSubmit('केंद्र सरकार सभी छात्रों को मुफ्त लैपटॉप और ₹25,000 की छात्रवृत्ति दे रही है।')}
                    className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-[#222222] cursor-pointer transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25">
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">केंद्र सरकार सभी छात्रों को मुफ्त लैपटॉप योजना</p>
                        <p className="text-[11px] text-zinc-400 truncate">Unicode Devanagari Normalizer • PIB Fact Check</p>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-zinc-400 text-[11px]">
                      1 hour ago
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end sm:justify-between">
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                        <span>Fake (99.7%)</span>
                      </span>
                      <button className="hidden sm:block text-zinc-500 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 3: ISRO Verified Real */}
                  <div
                    onClick={() => handleSubmit('ISRO successfully launched the meteorological satellite into sun-synchronous orbit.')}
                    className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-[#222222] cursor-pointer transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">ISRO meteorological satellite successfully deployed in orbit</p>
                        <p className="text-[11px] text-zinc-400 truncate">19 Fact Registries Verified • Official Press Registry</p>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-zinc-400 text-[11px]">
                      3 hours ago
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end sm:justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        <span>Verified Real</span>
                      </span>
                      <button className="hidden sm:block text-zinc-500 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic recent user checks if present */}
                  {filteredRecent.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectEnquiry(item)}
                      className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-[#222222] cursor-pointer transition-colors"
                    >
                      <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                            item.classification === 'fake'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : item.classification === 'suspicious'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}
                        >
                          {item.classification === 'fake' ? (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{item.headline || item.input}</p>
                          <p className="text-[11px] text-zinc-400 truncate font-mono">
                            {item.language_name || 'English'} • {item.confidence}% Confidence
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3 sm:col-span-3 text-zinc-400 text-[11px]">
                        Just now
                      </div>
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end sm:justify-between">
                        <span
                          className={`flex items-center gap-1.5 font-medium ${
                            item.classification === 'fake'
                              ? 'text-rose-400'
                              : item.classification === 'suspicious'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.classification === 'fake'
                                ? 'bg-rose-400'
                                : item.classification === 'suspicious'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          ></span>
                          <span>{item.classification.toUpperCase()}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnquiry(item.id);
                          }}
                          className="hidden sm:block text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          )}

          {/* Active Workspace: Deepfake Video Forensics */}
          {activeMode === 'deepfake' && (
            <div className="space-y-6">
              <DeepfakeForensicsSection />
            </div>
          )}

          {/* Active Workspace: Recent Checks Feed */}
          {activeMode === 'recent' && (
            <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Recent Enquiries &amp; Verification Checks</span>
                </div>
                <Link to="/history" className="text-xs font-mono text-zinc-300 hover:text-white hover:underline flex items-center gap-1">
                  <span>Full Database History</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {filteredRecent.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-zinc-400 space-y-3">
                  <p>No recent verification checks recorded yet.</p>
                  <Button size="sm" onClick={() => setActiveMode('news')} className="bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold">
                    Verify a claim now
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {filteredRecent.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectEnquiry(item)}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#222222] p-3 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                              item.classification === 'fake'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : item.classification === 'suspicious'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {item.classification}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {item.queryType.toUpperCase()} • {item.confidence}% Confidence
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-100 line-clamp-1">
                          {item.headline || item.input}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteEnquiry(item.id); }}
                          className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-400 hover:bg-[#262626]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Workspace: Model Benchmarks & Pipeline */}
          {activeMode === 'benchmarks' && (
            <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Model Heartbeats &amp; Evaluation</h2>
                  <p className="text-xs text-zinc-400">Cross-lingual test split performance across Indian linguistic contexts</p>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                  ● 3 Pipelines Operational
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-[#262626] text-left text-zinc-400">
                      <th className="pb-2">Linguistic Corpus</th>
                      <th className="pb-2">Tokenizer &amp; Features</th>
                      <th className="pb-2">Accuracy</th>
                      <th className="pb-2">Precision</th>
                      <th className="pb-2">Recall</th>
                      <th className="pb-2">F1 Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    <tr>
                      <td className="py-2.5 text-white font-medium">English Model (en)</td>
                      <td className="py-2.5 text-zinc-400">TF-IDF (12k N-grams)</td>
                      <td className="py-2.5 text-emerald-400 font-bold">93.8%</td>
                      <td className="py-2.5">0.94</td>
                      <td className="py-2.5">0.93</td>
                      <td className="py-2.5 font-bold">0.935</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-white font-medium">Hindi Model (hi)</td>
                      <td className="py-2.5 text-zinc-400">Devanagari NFKC (10k)</td>
                      <td className="py-2.5 text-emerald-400 font-bold">99.7%</td>
                      <td className="py-2.5">0.99</td>
                      <td className="py-2.5">0.99</td>
                      <td className="py-2.5 font-bold">0.997</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-white font-medium">Hinglish Model (hi-en)</td>
                      <td className="py-2.5 text-zinc-400">Code-mixed Latin (8k)</td>
                      <td className="py-2.5 text-emerald-400 font-bold">88.6%</td>
                      <td className="py-2.5">0.89</td>
                      <td className="py-2.5">0.88</td>
                      <td className="py-2.5 font-bold">0.885</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* "Get the most out of SatyaCheck" Section (#1C1C1C & #161616 checklist) */}
          <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-4 shadow-sm">
            
            {/* Header with progress */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Get the most out of SatyaCheck
                </h2>
                <p className="text-xs text-zinc-400">
                  Forensic verification checklist and evaluation readiness
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-zinc-200"></span>
                  <span>5 out of 6 steps left</span>
                </span>
                <button className="text-zinc-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-3 font-sans text-xs">
              
              {/* Step 1: Checked */}
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-[#222222] cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-950">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="font-medium text-zinc-200">
                    Create your first claim verification monitor
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>

              {/* Step 2: Active / Expanded Card (#161616 exact uploaded background) */}
              <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-zinc-500 mt-0.5 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-white">
                        Connect Slack, WhatsApp or Telegram Alerts
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                        Get alerted about newly trending disinformation campaigns, viral rumors, and resolve fact-check claims directly from messaging channels.
                      </p>

                      <div className="mt-3">
                        <Link to="/how-to-use">
                          <button className="rounded-md border border-[#2E2E2E] bg-[#222222] px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white hover:border-zinc-400 transition-colors">
                            User Guide
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Illustrated Integration Logo Box */}
                  <div className="hidden sm:flex items-center gap-2 rounded-lg border border-[#2B2B2B] bg-[#1C1C1C] px-3.5 py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-950">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#161616] border border-[#2B2B2B] text-emerald-400">
                      <Globe className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Invite colleagues */}
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-[#222222] cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-zinc-500 flex-shrink-0"></div>
                  <span className="font-medium text-zinc-300">
                    Invite colleagues and team members
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>

              {/* Step 4: Create public status page */}
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-[#222222] cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-zinc-500 flex-shrink-0"></div>
                  <span className="font-medium text-zinc-300">
                    Create a public veracity &amp; fact status page
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>

              {/* Step 5: Push notifications */}
              <div
                onClick={() => {
                  setAlertsModalOpen(true);
                  setHasUnreadAlerts(false);
                }}
                className="flex items-center justify-between rounded-lg p-2 hover:bg-[#222222] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-amber-500/80 bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                    <Bell className="h-2.5 w-2.5 text-amber-400" />
                  </div>
                  <span className="font-medium text-zinc-300">
                    Get push notifications &amp; webhook alerts
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>

              {/* Step 6: Technical documentation */}
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-[#222222] cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-zinc-500 flex-shrink-0"></div>
                  <span className="font-medium text-zinc-300">
                    Review system architecture &amp; technical documentation
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>

            </div>
          </div>

        </main>

        {/* Floating Chat / Help Bubble in bottom right */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            title="Forensic Feedback & AI Assistant"
            onClick={() => setFeedbackModalOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-white shadow-xl hover:bg-[#262626] hover:scale-105 transition-all"
          >
            <MessageSquare className="h-5 w-5 text-emerald-400" />
          </button>
        </div>

        {/* Minimal Footer */}
        <footer className="mt-auto border-t border-[#262626] bg-[#141414] py-5 text-center font-mono text-xs text-zinc-400">
          <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>SatyaCheck — Multilingual Fake News &amp; Deepfake Media Forensics</p>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <Link to="/how-to-use" className="hover:text-white">User Guide</Link>
              <Link to="/about" className="hover:text-white">About</Link>
              <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
              <Link to="/history" className="hover:text-white">Audit History</Link>
            </div>
          </div>
        </footer>

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
          initialClaim={result?.headline || ''}
        />

      </div>
    </div>
  );
};

export default Index;
