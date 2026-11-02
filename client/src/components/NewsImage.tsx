import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  HeartPulse,
  TrendingUp,
  Cpu,
  Rocket,
  Trophy,
  Film,
  Share2,
  GraduationCap,
  Globe2,
  Newspaper,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export interface NewsImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  publisher?: string;
  headline?: string;
  className?: string;
}

interface CategoryVisualConfig {
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accentColor: string;
  pattern: string;
}

/**
 * Maps category and headline keywords to contextual thematic visual styles
 * Ensures illustrative representations are strictly topic-relevant.
 */
function resolveCategoryConfig(category?: string, headline?: string): CategoryVisualConfig {
  const text = `${category || ''} ${headline || ''}`.toLowerCase();

  if (text.match(/politic|election|parliament|minister|government|modi|rahul|bjp|congress|vote|mla|mp/)) {
    return {
      label: 'Politics & Governance',
      badge: 'Politics',
      icon: Building2,
      gradient: 'from-rose-950/40 via-[#181818] to-[#121212]',
      accentColor: 'text-rose-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.08) 0%, transparent 60%)'
    };
  }

  if (text.match(/health|medical|vaccine|virus|doctor|disease|covid|hospital|ayush|who|tablet|cure/)) {
    return {
      label: 'Health & Medicine',
      badge: 'Health',
      icon: HeartPulse,
      gradient: 'from-emerald-950/40 via-[#181818] to-[#121212]',
      accentColor: 'text-emerald-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)'
    };
  }

  if (text.match(/finance|rbi|bank|economy|rupee|currency|tax|gst|budget|market|crypto|loan|money/)) {
    return {
      label: 'Finance & Economy',
      badge: 'Finance',
      icon: TrendingUp,
      gradient: 'from-amber-950/40 via-[#181818] to-[#121212]',
      accentColor: 'text-amber-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)'
    };
  }

  if (text.match(/tech|ai|cyber|digital|software|internet|telecom|computer|hacker|scam/)) {
    return {
      label: 'Technology & Cyber Forensics',
      badge: 'Technology',
      icon: Cpu,
      gradient: 'from-zinc-900 via-[#181818] to-[#121212]',
      accentColor: 'text-zinc-200',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(212, 212, 216, 0.08) 0%, transparent 60%)'
    };
  }

  if (text.match(/science|space|isro|nasa|satellite|moon|mars|astronomy|physics|climate/)) {
    return {
      label: 'Science & Aerospace',
      badge: 'Science',
      icon: Rocket,
      gradient: 'from-indigo-950/40 via-[#181818] to-[#121212]',
      accentColor: 'text-indigo-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)'
    };
  }

  if (text.match(/sport|cricket|ipl|bcci|match|kohli|football|fifa|olympic|athlete/)) {
    return {
      label: 'Sports & Athletics',
      badge: 'Sports',
      icon: Trophy,
      gradient: 'from-emerald-950/30 via-[#181818] to-[#121212]',
      accentColor: 'text-emerald-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.07) 0%, transparent 60%)'
    };
  }

  if (text.match(/entertainment|movie|cinema|actor|actress|film|bollywood|ott|celebrity/)) {
    return {
      label: 'Entertainment & Media',
      badge: 'Entertainment',
      icon: Film,
      gradient: 'from-purple-950/40 via-[#181818] to-[#121212]',
      accentColor: 'text-purple-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)'
    };
  }

  if (text.match(/whatsapp|viral|rumor|rumour|forward|facebook|instagram|social media|twitter|claim/)) {
    return {
      label: 'Social Media Rumors',
      badge: 'Social Media',
      icon: Share2,
      gradient: 'from-amber-950/30 via-[#181818] to-[#121212]',
      accentColor: 'text-amber-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.07) 0%, transparent 60%)'
    };
  }

  if (text.match(/education|exam|student|university|college|cbse|degree|school/)) {
    return {
      label: 'Education & Academics',
      badge: 'Education',
      icon: GraduationCap,
      gradient: 'from-zinc-900 via-[#181818] to-[#121212]',
      accentColor: 'text-zinc-300',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(161, 161, 170, 0.07) 0%, transparent 60%)'
    };
  }

  if (text.match(/india|delhi|mumbai|bengal|karnataka|up|bihar|national/)) {
    return {
      label: 'National Investigation',
      badge: 'India',
      icon: Globe2,
      gradient: 'from-emerald-950/30 via-[#181818] to-[#121212]',
      accentColor: 'text-emerald-400',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)'
    };
  }

  return {
    label: 'Verified Fact-Check Investigation',
    badge: 'Fact-Check Wire',
    icon: Newspaper,
    gradient: 'from-[#202020] via-[#181818] to-[#121212]',
    accentColor: 'text-zinc-300',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.04) 0%, transparent 60%)'
  };
}

export const NewsImage: React.FC<NewsImageProps> = ({
  src,
  alt,
  category,
  publisher,
  headline,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const config = resolveCategoryConfig(category, headline);
  const CategoryIcon = config.icon;

  const showGenuineImage = src && !imageError;

  return (
    <div
      className={`relative w-full aspect-[16/9] overflow-hidden rounded-lg border border-[#2B2B2B] bg-[#141414] select-none ${className}`}
    >
      {/* 1. Genuine Image Rendering */}
      {showGenuineImage ? (
        <>
          {/* Loading Skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-[#1E1E1E] animate-pulse flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          )}

          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />

          {/* Vignette Overlay for Crisp Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

          {/* Publisher Wire Attribution Pill (clean frosted overlay on hover) */}
          <div className="absolute top-2.5 left-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/70 border border-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md shadow-sm">
              <Newspaper className="h-3.5 w-3.5 text-zinc-300" />
              <span className="truncate max-w-[150px]">{publisher || 'Verified Fact-Check Wire'}</span>
            </span>
          </div>
        </>
      ) : (
        /* 2. Category-Based Fallback Illustration */
        <div
          className={`relative w-full h-full bg-gradient-to-br ${config.gradient} p-4 flex flex-col justify-between overflow-hidden`}
          style={{ backgroundImage: config.pattern }}
        >
          {/* Subtle Grid Watermark Overlay */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top Pill: Category & Context Indicator */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-[#161616]/90 border border-[#303030] px-2.5 py-1 font-mono text-[10px] font-bold text-zinc-200 backdrop-blur-md shadow-sm">
              <Sparkles className={`h-3 w-3 ${config.accentColor}`} />
              <span>Context Illustration • {config.badge}</span>
            </span>

            {publisher && (
              <span className="rounded bg-[#121212]/80 border border-[#262626] px-2 py-0.5 font-mono text-[9px] text-zinc-400">
                {publisher}
              </span>
            )}
          </div>

          {/* Center Graphic: Prominent Thematic Category Motif */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center px-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#333333] bg-[#181818]/90 shadow-inner">
              <CategoryIcon className={`h-6 w-6 ${config.accentColor}`} />
            </div>
            <div className="mt-2 font-mono text-[11px] font-semibold tracking-wide text-zinc-300 uppercase">
              {config.label}
            </div>
          </div>

          {/* Bottom Transparency Notice (Mandatory Rule Compliance) */}
          <div className="relative z-10 flex items-center justify-between border-t border-[#262626]/80 pt-2 font-mono text-[9px] text-zinc-400">
            <span className="truncate max-w-[220px]">
              {category || 'Verified Misinformation Registry'}
            </span>
            <span className="text-zinc-500 whitespace-nowrap">
              Illustrative Context
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
