import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Info,
  Globe,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CredibilitySection } from './CredibilitySection';
import { DetectionResult } from '@/services/detection';
import { toast } from 'sonner';

interface ResultCardProps {
  result: DetectionResult;
}

export const ResultCard = ({ result }: ResultCardProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const isFake = result.classification === 'fake';
  const isSuspicious = result.classification === 'suspicious';
  const isAuthentic = result.classification === 'authentic';

  const getStatusBadge = () => {
    if (isFake) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-950/40 px-3 py-1.5 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
          <XCircle className="h-5 w-5 text-red-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-red-400">
            {t('result.fake')}
          </span>
        </div>
      );
    }
    if (isSuspicious) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-amber-400">
            {t('result.suspicious')}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-3 py-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <span className="font-mono text-xs font-bold tracking-wider text-emerald-400">
          {t('result.real')}
        </span>
      </div>
    );
  };

  const handleCopy = () => {
    const text = `[SatyaCheck Verification Report]\nStatus: ${result.classification.toUpperCase()}\nAuthenticity Score: ${Math.round(result.authenticityScore * 100)}%\nConfidence: ${result.confidence}%\nClaim: "${result.headline || result.input}"`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Report copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
        isFake
          ? 'border-red-500/40 bg-[#120B10]'
          : isSuspicious
          ? 'border-amber-500/40 bg-[#141009]'
          : 'border-emerald-500/40 bg-[#091512]'
      }`}
    >
      {/* Top Banner & Copy Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B2B2B] pb-4">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {result.language_name && (
            <span className="rounded border border-[#2B2B2B] bg-[#161616] px-2 py-1 text-[11px] font-mono text-zinc-300">
              {result.language_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {result.credibilityBoost?.applied && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-mono text-emerald-300">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>+{Math.round(result.credibilityBoost.boost_amount * 100)}% Credibility Boost</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-[#222222]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>
      </div>

      {/* Verified Claim Content */}
      <div className="my-4 space-y-1.5">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Analyzed Claim / Article:
        </div>
        <p className="text-base font-semibold text-zinc-100 leading-snug">
          {result.headline || result.input}
        </p>
        {result.headline && result.input !== result.headline && (
          <p className="truncate font-mono text-xs text-zinc-400">{result.input}</p>
        )}
      </div>

      {/* Dual Scores Grid (Authenticity & Model Confidence) */}
      <div className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Authenticity Bar */}
        <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-3.5">
          <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
            <span>{t('result.authenticityScore')}</span>
            <span
              className={`font-bold ${
                isFake ? 'text-red-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {Math.round(result.authenticityScore * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#262626]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFake
                  ? 'bg-red-500'
                  : isSuspicious
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.round(result.authenticityScore * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-3.5">
          <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
            <span>{t('result.confidence')}</span>
            <span className="font-bold text-white font-mono">{result.confidence}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#262626]">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${result.confidence}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Explainable AI (XAI) - TF-IDF Feature Weights */}
      {result.top_signals && result.top_signals.length > 0 && (
        <div className="my-4 space-y-2.5 rounded-lg border border-[#2B2B2B] bg-[#161616] p-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-zinc-400" />
              <span>Predictive Linguistic Signals (TF-IDF Feature Weights)</span>
            </span>
            <span className="text-[10px] text-zinc-400">Explainable AI (XAI)</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {result.top_signals.map((signal, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-mono ${
                  signal.impact === 'authentic'
                    ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                    : 'border-red-500/30 bg-red-950/40 text-red-300'
                }`}
              >
                <span className="font-semibold font-sans">{signal.term}</span>
                <span className="text-[10px] opacity-75">
                  {signal.weight > 0 ? `+${signal.weight}` : signal.weight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Diagnostic Reasoning */}
      {result.reasoning && result.reasoning.length > 0 && (
        <div className="my-4 space-y-2 rounded-lg border border-[#2B2B2B] bg-[#161616] p-4">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-zinc-200">
            <Cpu className="h-4 w-4 text-zinc-400" />
            <span>{t('result.reasoningHeading')}</span>
          </div>
          <ul className="space-y-1.5 pl-1">
            {result.reasoning.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400"></span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* News Portal Search Cross-Check */}
      <CredibilitySection credibility={result.credibility} />

      {/* Academic Disclaimer Box */}
      <div className="mt-5 rounded-lg border border-[#2B2B2B] bg-[#161616] p-3">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />
          <div className="text-[11px] leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-200">{t('result.disclaimerTitle')}: </span>
            {t('result.disclaimerText')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
