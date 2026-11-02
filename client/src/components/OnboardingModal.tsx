import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthService, User } from '@/services/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Newspaper,
  Sparkles,
  Database,
  LayoutDashboard,
  Check,
  ArrowRight,
  ArrowLeft,
  Globe,
  Radio,
  Flame,
  Cpu,
  GraduationCap,
  HeartPulse,
  Atom,
  Trophy,
  Film,
  Coins,
  Compass,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (updatedUser: User) => void;
}

const CATEGORIES = [
  { id: 'Politics', label: 'Politics', icon: Compass, desc: 'Government, elections & policy debunks' },
  { id: 'Technology', label: 'Technology', icon: Cpu, desc: 'AI, cyber threats, telecom & online scams' },
  { id: 'Education', label: 'Education', icon: GraduationCap, desc: 'Exams, paper leaks & university claims' },
  { id: 'Health', label: 'Health', icon: HeartPulse, desc: 'Medical rumors, viral cures & vaccines' },
  { id: 'Science', label: 'Science', icon: Atom, desc: 'Space, ISRO, NASA & astronomy research' },
  { id: 'Sports', label: 'Sports', icon: Trophy, desc: 'Cricket, tournaments & athletics facts' },
  { id: 'Entertainment', label: 'Entertainment', icon: Film, desc: 'Cinema, celebrities & media gossip' },
  { id: 'Finance', label: 'Finance', icon: Coins, desc: 'RBI currency, banking & economic schemes' },
  { id: 'International News', label: 'International News', icon: Globe, desc: 'Global diplomacy, conflicts & world events' },
  { id: 'Social Media Rumors', label: 'Social Media Rumors', icon: MessageSquare, desc: 'WhatsApp forwards & viral claims' }
];

const LANGUAGES = [
  { id: 'all', label: 'All Languages', desc: 'English, Hindi & Hinglish mix' },
  { id: 'en', label: 'English', desc: 'Global & national English fact-checks' },
  { id: 'hi', label: 'Hindi (हिंदी)', desc: 'Devanagari verified investigations' },
  { id: 'hinglish', label: 'Hinglish', desc: 'Romanized Hindi & colloquial forwards' }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.selected_interests && user.selected_interests.length > 0
      ? user.selected_interests
      : ['Politics', 'Technology', 'Social Media Rumors']
  );
  const [preferredLanguage, setPreferredLanguage] = useState<string>(
    user?.preferred_language || 'all'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (categoryId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const updated = await AuthService.completeOnboarding({
        preferred_language: 'all',
        selected_interests: []
      });
      await refreshUser();
      toast.success('Welcome to SatyaCheck! Your dashboard is ready.');
      onComplete?.(updated);
      onClose();
    } catch {
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSubmitting(true);
    try {
      const updated = await AuthService.completeOnboarding({
        preferred_language: preferredLanguage,
        selected_interests: selectedInterests
      });
      await refreshUser();
      toast.success('Your preferences have been saved! Recommendations updated.');
      onComplete?.(updated);
      onClose();
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}>
      <DialogContent className="max-w-2xl border border-[#2E2E2E] bg-[#161616] p-0 text-zinc-100 shadow-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Step Progress Bar */}
        <div className="flex h-1.5 w-full bg-[#242424]">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {step === 1 ? (
            /* STEP 1: WELCOME SCREEN */
            <div className="space-y-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  <span>First-Time Investigator Onboarding • Step 1 of 2</span>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome to SatyaCheck!
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                  Discover misinformation, explore verified fact-checks, and learn how to identify fake news across multilingual digital networks.
                </DialogDescription>
              </div>

              {/* 5 Core Features Guide */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                
                {/* Feature 1 */}
                <div className="flex items-start gap-3 rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-3.5 transition-colors hover:border-[#3A3A3A]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#242424] text-white">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Fake News Detection</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Analyze news headlines, claims, and URLs using multilingual ML and portal cross-checks.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-3.5 transition-colors hover:border-[#3A3A3A]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#242424] text-white">
                    <Newspaper className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Live Fact-Check Feed</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Explore recently verified misinformation claims synced continuously from official registries.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-3.5 transition-colors hover:border-[#3A3A3A]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#242424] text-white">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Recommended News</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Discover tailored fact-check investigations matching your preferred topics and language.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-3 rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-3.5 transition-colors hover:border-[#3A3A3A]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#242424] text-white">
                    <Database className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Prediction History</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Access all your previous forensic checks, export audit trails, and manage saved records.
                    </p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-3.5 transition-colors hover:border-[#3A3A3A]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#242424] text-white">
                    <LayoutDashboard className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Personal Dashboard</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Track your verification activity, analyze fake vs authentic ratios, and explore curated trends.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* STEP 2: TOPIC INTEREST & LANGUAGE SELECTION */
            <div className="space-y-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2E2E2E] bg-[#1C1C1C] px-3 py-0.5 font-mono text-[11px] font-semibold text-zinc-300">
                  <span>Step 2 of 2 • Custom Preferences</span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-extrabold text-white">
                  What topics do you want to monitor?
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Select your topics of interest so we can immediately populate your feed with relevant fact-checks.
                </DialogDescription>
              </div>

              {/* 10 Topic Categories Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Select Topics (Multi-Select)</span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {selectedInterests.length} selected
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedInterests.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleInterest(cat.id)}
                        className={`group flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-950/20 text-white'
                            : 'border-[#2B2B2B] bg-[#1C1C1C] text-zinc-300 hover:border-[#383838] hover:bg-[#202020]'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'bg-[#242424] text-zinc-400 group-hover:text-white'
                          }`}
                        >
                          {isSelected ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold leading-tight">{cat.label}</div>
                          <p className="mt-0.5 text-[10px] text-zinc-400 line-clamp-1 leading-normal">
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Language Selection */}
              <div className="space-y-2 pt-2 border-t border-[#262626]">
                <label className="text-xs font-semibold text-zinc-300">
                  Preferred Content Language
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LANGUAGES.map((lang) => {
                    const isSelected = preferredLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setPreferredLanguage(lang.id)}
                        className={`rounded-lg border p-2.5 text-center text-xs transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/30 text-white font-semibold'
                            : 'border-[#2B2B2B] bg-[#1C1C1C] text-zinc-400 hover:bg-[#222222] hover:text-white'
                        }`}
                      >
                        <div>{lang.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-[#262626] bg-[#141414] px-6 py-4 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-xs text-zinc-400 hover:text-white hover:bg-[#1E1E1E]"
              >
                Skip for now
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="gap-2 bg-white text-xs font-bold text-zinc-950 hover:bg-zinc-200"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="gap-1.5 text-xs text-zinc-400 hover:text-white hover:bg-[#1E1E1E]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-xs text-zinc-400 hover:text-white hover:bg-[#1E1E1E]"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSubmitting}
                  className="gap-2 bg-emerald-500 text-xs font-bold text-zinc-950 hover:bg-emerald-400 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Enter Dashboard</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
