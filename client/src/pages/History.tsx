import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HistoryService, SavedPrediction } from '@/services/history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/UserNav';
import {
  ShieldCheck,
  Search,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  ArrowLeft,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  X,
  Newspaper
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<SavedPrediction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState<'all' | 'authentic' | 'suspicious' | 'fake'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Selected item for modal
  const [selectedItem, setSelectedItem] = useState<SavedPrediction | null>(null);

  useEffect(() => {
    loadHistory(currentPage);
  }, [currentPage, labelFilter, sortOrder, activeQuery]);

  const loadHistory = async (pageToLoad: number) => {
    setIsLoading(true);
    try {
      const res = await HistoryService.getHistory({
        q: activeQuery || undefined,
        label: labelFilter === 'all' ? undefined : labelFilter,
        page: pageToLoad,
        limit: 10,
        sort: sortOrder
      });
      setHistory(res.history);
      setTotalCount(res.total ?? res.history.length);
      setTotalPages(res.total_pages ?? Math.max(1, Math.ceil((res.total ?? 1) / 10)));
    } catch {
      toast.error('Failed to load prediction history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveQuery(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveQuery('');
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await HistoryService.deletePrediction(id);
      toast.success('Record deleted.');
      if (selectedItem?.id === id) setSelectedItem(null);
      // Reload current page or step back if page emptied
      if (history.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        loadHistory(currentPage);
      }
    } catch {
      toast.error('Failed to delete record.');
    }
  };

  const handleClearAll = async () => {
    try {
      const count = await HistoryService.clearHistory();
      toast.success(`Cleared ${count} records from database.`);
      setHistory([]);
      setTotalCount(0);
      setTotalPages(1);
      setCurrentPage(1);
      setSelectedItem(null);
    } catch {
      toast.error('Failed to clear history.');
    }
  };

  const formatDate = (isoString: string) => {
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

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#141414]/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <ArrowLeft className="h-4 w-4 text-zinc-400 hover:text-white transition-colors" />
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
            <Link to="/dashboard">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                Dashboard
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

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 space-y-6">
        
        {/* Title Bar & Clear All Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-5">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Prediction Audit History
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-0.5">
              {totalCount} total verified news claims stored in your personal database
            </p>
          </div>

          {totalCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All History</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-[#2B2B2B] bg-[#1C1C1C] text-zinc-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono text-sm font-bold text-rose-400">
                    Clear Entire Prediction History?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-zinc-400 leading-relaxed">
                    This will permanently delete all {totalCount} prediction records and reset your personal dashboard statistics. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[#2B2B2B] bg-[#161616] text-xs text-zinc-300 hover:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
                  >
                    Yes, Clear All Records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-4">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by claim keywords, headline, or text..."
              className="pl-9 pr-8 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400 h-9"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { setLabelFilter('all'); setCurrentPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                labelFilter === 'all'
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'bg-[#161616] text-zinc-400 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setLabelFilter('authentic'); setCurrentPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                labelFilter === 'authentic'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-medium'
                  : 'bg-[#161616] text-zinc-400 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              Authentic
            </button>
            <button
              onClick={() => { setLabelFilter('fake'); setCurrentPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                labelFilter === 'fake'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-medium'
                  : 'bg-[#161616] text-zinc-400 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              Fake
            </button>
            <button
              onClick={() => { setLabelFilter('suspicious'); setCurrentPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                labelFilter === 'suspicious'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-medium'
                  : 'bg-[#161616] text-zinc-400 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              Suspicious
            </button>
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-1.5 border-l border-[#2B2B2B] pl-3">
            <span className="text-[11px] font-mono text-zinc-400">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'newest' | 'oldest');
                setCurrentPage(1);
              }}
              className="rounded-lg border border-[#2B2B2B] bg-[#161616] px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* History List Table / Cards */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] overflow-hidden">
          {isLoading ? (
            <div className="flex py-16 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#2B2B2B] bg-[#161616] text-zinc-400">
                <FileText className="h-6 w-6" />
              </div>
              <p className="font-mono text-xs text-zinc-400">
                {activeQuery || labelFilter !== 'all'
                  ? 'No matching prediction records found for your search criteria.'
                  : 'No predictions recorded yet. Start by analyzing a news claim.'}
              </p>
              {activeQuery || labelFilter !== 'all' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleClearSearch();
                    setLabelFilter('all');
                  }}
                  className="border-[#2B2B2B] bg-[#161616] text-xs text-zinc-300 hover:text-white"
                >
                  Clear Filters
                </Button>
              ) : (
                <Link to="/">
                  <Button size="sm" className="bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950">
                    Analyze First Claim
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#262626]">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#222222] transition-colors"
                >
                  <div className="space-y-1.5 max-w-3xl">
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
                        {item.input_type.toUpperCase()}
                      </span>

                      <span className="font-mono text-[10px] text-zinc-400">
                        {item.detected_language ? item.detected_language.toUpperCase() : 'EN'} • {item.confidence}% Confidence
                      </span>

                      <span className="font-mono text-[10px] text-zinc-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-zinc-200 line-clamp-2 leading-relaxed">
                      {item.headline || item.input_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="h-8 gap-1.5 border-[#2B2B2B] bg-[#161616] px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-[#222222]"
                    >
                      <Eye className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Details</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400 hover:bg-[#222222]"
                      title="Delete Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#262626] px-4 py-3 bg-[#141414]">
              <div className="text-xs font-mono text-zinc-400">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 gap-1 border-[#2B2B2B] bg-[#161616] px-2 text-xs text-zinc-300 disabled:opacity-40 hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 gap-1 border-[#2B2B2B] bg-[#161616] px-2 text-xs text-zinc-300 disabled:opacity-40 hover:text-white"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Detail Modal Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-xl border-[#2B2B2B] bg-[#1C1C1C] p-6 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm font-bold text-white flex items-center justify-between">
              <span>Saved Analysis Record</span>
              {selectedItem && (
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    selectedItem.predicted_label === 'fake'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : selectedItem.predicted_label === 'suspicious'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedItem.predicted_label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 pt-2 font-mono text-xs">
              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-3 space-y-1">
                <span className="text-[10px] uppercase text-zinc-400">Claim / Statement</span>
                <p className="text-white font-sans text-sm font-medium leading-relaxed">
                  {selectedItem.headline || selectedItem.input_text}
                </p>
                {selectedItem.headline && selectedItem.input_text !== selectedItem.headline && (
                  <p className="text-[11px] text-zinc-400 break-all">{selectedItem.input_text}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2.5">
                  <span className="text-[10px] text-zinc-400 uppercase">Authenticity Score</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {Math.round(selectedItem.authenticity_score * 100)}%
                  </p>
                </div>

                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2.5">
                  <span className="text-[10px] text-zinc-400 uppercase">Model Confidence</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {selectedItem.confidence}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2">
                  <span className="text-zinc-400">Language:</span>{' '}
                  <span className="text-zinc-200 font-semibold">{selectedItem.detected_language?.toUpperCase() || 'EN'}</span>
                </div>
                <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2">
                  <span className="text-zinc-400">Input Mode:</span>{' '}
                  <span className="text-zinc-200 font-semibold">{selectedItem.input_type.toUpperCase()}</span>
                </div>
              </div>

              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Recorded: {formatDate(selectedItem.created_at)}</span>
                <span>{selectedItem.model_version}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;
