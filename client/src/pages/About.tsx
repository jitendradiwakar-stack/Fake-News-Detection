import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 selection:bg-zinc-800 selection:text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2B2B2B] bg-[#141414]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#1C1C1C]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">SatyaCheck</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-mono text-zinc-300 hover:text-white hover:bg-[#222222]">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to App</span>
              </Button>
            </Link>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Hero Heading */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2B2B2B] bg-[#161616] px-3 py-1 font-mono text-xs font-semibold text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
              <span>System Overview &amp; Verification Architecture</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              About SatyaCheck
            </h1>
            <p className="text-sm font-mono text-zinc-400">
              "Understand the news. Question the claim. Check the evidence."
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              SatyaCheck is a hybrid, cyber-forensic verification system engineered to combat the rapid spread of misinformation, fabricated headlines, WhatsApp forwards, and synthetic media across multilingual digital ecosystems (English, Hindi, Hinglish, and Bengali).
            </p>
          </div>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-5 backdrop-blur-md">
              <Code2 className="h-6 w-6 text-white mb-3" />
              <h3 className="font-semibold text-white text-sm">Full-Stack Decoupled Architecture</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Vite + React 18 frontend communicating via clean JSON REST contracts to an asynchronous Flask backend.
              </p>
            </div>

            <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-5 backdrop-blur-md">
              <Cpu className="h-6 w-6 text-zinc-300 mb-3" />
              <h3 className="font-semibold text-white text-sm">Multilingual ML Classifiers</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Independent TF-IDF and regularized Logistic Regression models trained on verified English, Hindi, and Bengali datasets.
              </p>
            </div>

            <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-5 backdrop-blur-md">
              <ShieldCheck className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white text-sm">Real-Time News Portal Cross-Check</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Dynamic DuckDuckGo API integration cross-referencing claims across 40+ trusted national & global news outlets.
              </p>
            </div>
          </div>

          {/* Technical Architecture & Core Highlights */}
          <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-white" />
              <span>Technical Architecture &amp; Key Highlights</span>
            </h2>

            <div className="space-y-4 font-mono text-xs">
              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-4 space-y-1.5">
                <div className="font-bold text-white">
                  Q1: Why use TF-IDF with Logistic Regression instead of fine-tuning large LLMs?
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  <strong>Answer:</strong> TF-IDF combined with regularized Logistic Regression provides sub-second inference latency, requires zero expensive GPU compute in deployment, eliminates LLM hallucinations, and provides fully explainable linear weight contributions for specific n-gram tokens.
                </p>
              </div>

              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-4 space-y-1.5">
                <div className="font-bold text-white">
                  Q2: How does SatyaCheck handle Hinglish / Code-Mixed text?
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  <strong>Answer:</strong> Hinglish is detected via lexical density tracking of common Romanized Hindi phonemes and keywords. The system utilizes subword char/word (1,2) n-grams that accommodate phonetic spelling variations (e.g. "sach" vs "sachh").
                </p>
              </div>

              <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-4 space-y-1.5">
                <div className="font-bold text-white">
                  Q3: How does the credibility boost mechanism work?
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  <strong>Answer:</strong> If an unverified or low-confidence claim is found published on verified news portals (e.g. BBC, Jagran, The Hindu), each confirmed portal awards a 5% authenticity boost (capped at 50% max boost) to reflect corroborating real-world evidence.
                </p>
              </div>
            </div>
          </div>

          {/* Ethical Disclaimer */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed space-y-1">
                <span className="font-bold text-amber-300">System Notice &amp; Methodological Scope: </span>
                <span>
                  SatyaCheck provides automated algorithmic assessment based on mathematical language patterns, which should be synthesized with human editorial judgment and established fact-checking consortia.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default About;
