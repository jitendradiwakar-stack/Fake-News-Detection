import React from 'react';
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Quote,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewsImage } from './NewsImage';
import { FactCheckArticle } from '@/services/factCheckService';

export interface NewsCardProps {
  article: FactCheckArticle;
  onOpenDetail: (article: FactCheckArticle) => void;
  onAnalyze: (article: FactCheckArticle) => void;
  onFeedback?: (article: FactCheckArticle) => void;
  formatTimeAgo: (dateStr: string) => string;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  onOpenDetail,
  onAnalyze,
  onFeedback,
  formatTimeAgo
}) => {
  // Render normalized verdict badge with color coding
  const renderVerdictBadge = (verdict: string, rawRating?: string) => {
    switch (verdict) {
      case 'False':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 shadow-xs">
            <XCircle className="h-4 w-4" />
            <span>{rawRating || 'FALSE / FAKE'}</span>
          </div>
        );
      case 'Misleading':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 shadow-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>{rawRating || 'MISLEADING'}</span>
          </div>
        );
      case 'Partly False':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 text-xs sm:text-sm font-bold text-orange-700 dark:text-orange-400 shadow-xs">
            <AlertCircle className="h-4 w-4" />
            <span>{rawRating || 'PARTLY FALSE'}</span>
          </div>
        );
      case 'True':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>{rawRating || 'VERIFIED TRUE'}</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 shadow-xs">
            <Info className="h-4 w-4" />
            <span>{rawRating || 'UNRATED CLAIM'}</span>
          </div>
        );
    }
  };

  return (
    <article
      className="group flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-[#2B2B2B] bg-white dark:bg-[#1C1C1C] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-500/80 hover:shadow-md"
    >
      <div className="space-y-3.5">
        
        {/* 1. Publisher name, publication time and language */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-[#262626] pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 items-center rounded border border-zinc-300 dark:border-[#2B2B2B] bg-zinc-100 dark:bg-[#161616] px-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {article.fact_check_publisher}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              {formatTimeAgo(article.review_date)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="rounded bg-zinc-100 dark:bg-[#161616] border border-zinc-300 dark:border-[#2B2B2B] px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-400">
              {article.language === 'hi' ? 'हिंदी' : 'EN'}
            </span>
            {article.category === 'India' && (
              <span className="rounded bg-zinc-100 dark:bg-[#161616] border border-zinc-300 dark:border-[#2B2B2B] px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                🇮🇳 IN
              </span>
            )}
          </div>
        </div>

        {/* 2. Large news image (16:9 aspect ratio, object-fit: cover, rounded corners) */}
        <div>
          <NewsImage
            src={article.image_url}
            alt={article.claim_text}
            category={article.category}
            publisher={article.fact_check_publisher}
            headline={article.claim_text}
          />
        </div>

        {/* 3. Fact-check verdict badge */}
        <div>
          {renderVerdictBadge(article.normalized_verdict, article.publisher_rating)}
        </div>

        {/* 4. News headline */}
        <h3
          onClick={() => onOpenDetail(article)}
          className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-3 hover:text-emerald-600 dark:hover:text-white transition-colors cursor-pointer"
          title={article.claim_text}
        >
          {article.claim_text}
        </h3>

        {/* 5. Claimed by information */}
        {article.claimant && (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-600 dark:text-zinc-500">Claimed by:</span>
            <span className="text-zinc-800 dark:text-zinc-300 font-medium truncate">
              {article.claimant}
            </span>
          </div>
        )}

        {/* 6. Short fact-check explanation */}
        {article.explanation && (
          <div className="rounded-lg border border-zinc-200 dark:border-[#262626] bg-zinc-50 dark:bg-[#141414] p-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
            {article.explanation}
          </div>
        )}

      </div>

      {/* Card Footer: Action Links & SatyaCheck Analysis Button */}
      <div className="mt-5 pt-3.5 border-t border-zinc-200 dark:border-[#262626] space-y-3">
        {/* 7. View Full Details and Official Source links */}
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => onOpenDetail(article)}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            View Full Details
          </button>

          <div className="flex items-center gap-3">
            {onFeedback && (
              <button
                type="button"
                onClick={() => onFeedback(article)}
                className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Report claim or contest verdict"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Feedback</span>
              </button>
            )}

            {article.fact_check_url && (
              <a
                href={article.fact_check_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white underline underline-offset-4"
                title="Open official fact-check article"
              >
                <span>Official Source</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 8. Analyze with SatyaCheck button */}
        <Button
          type="button"
          size="sm"
          onClick={() => onAnalyze(article)}
          className="btn-verify-claim w-full h-10 gap-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs sm:text-sm font-bold transition-all shadow-sm rounded-lg"
        >
          <Sparkles className="h-4 w-4" />
          <span>Analyze with SatyaCheck</span>
        </Button>
      </div>
    </article>
  );
};
