import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  ShieldAlert,
  Link as LinkIcon,
  FileText,
  Loader2,
  Trash2,
  Send,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface NewsInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const NewsInput = ({ onSubmit, isLoading, initialValue }: NewsInputProps) => {
  const { t } = useTranslation();
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [textInput, setTextInput] = useState(initialValue || '');
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (initialValue) {
      setTextInput(initialValue);
      setInputMode('text');
    }
  }, [initialValue]);

  const currentVal = inputMode === 'text' ? textInput : urlInput;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = currentVal.trim();

    if (!query) {
      toast.error(t('input.validation.empty'));
      return;
    }

    if (query.length < 10) {
      toast.error(t('input.validation.invalid'));
      return;
    }

    if (inputMode === 'url' && !query.startsWith('http://') && !query.startsWith('https://')) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    onSubmit(query);
  };

  const handleClear = () => {
    if (inputMode === 'text') setTextInput('');
    else setUrlInput('');
  };

  const loadSample = (sample: string) => {
    setInputMode('text');
    setTextInput(sample);
  };

  return (
    <div className="w-full space-y-3">
      {/* Tab Switcher & Mode Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-[#2B2B2B] bg-[#161616] p-1">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-all ${
              inputMode === 'text'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t('input.headlineTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-all ${
              inputMode === 'url'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>{t('input.urlTab')}</span>
          </button>
        </div>

        {currentVal && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 gap-1.5 text-xs font-mono text-zinc-400 hover:text-rose-400 hover:bg-[#222222]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t('input.clear')}</span>
          </Button>
        )}
      </div>

      {/* Input Box Card */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative rounded-xl border border-[#2B2B2B] bg-[#161616] p-4 transition-all focus-within:border-zinc-400 shadow-sm">
          {inputMode === 'text' ? (
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('input.placeholder')}
              className="min-h-[120px] resize-none border-0 bg-transparent text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
          ) : (
            <div className="py-2">
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t('input.urlPlaceholder')}
                className="border-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Bottom Bar: Character Count & Submit Action */}
          <div className="mt-3 flex items-center justify-between border-t border-[#2B2B2B] pt-3">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="flex h-2 w-2 rounded-full bg-zinc-300"></span>
              <span>
                {currentVal.length} {t('input.charCount')}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !currentVal.trim()}
              className="gap-2 bg-white text-zinc-950 px-5 text-xs font-semibold transition-all hover:bg-zinc-200 disabled:opacity-50 shadow-sm rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>{t('input.analyzing')}</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>Run Forensic Check</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Quick Test Samples (English, Hindi, Hinglish) for demonstration */}
      <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-3.5">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-300">
          <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
          <span>Quick Benchmark Claims:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => loadSample('NASA confirms discovery of ancient microbial life fossils on Mars surface.')}
            className="rounded-lg border border-[#2E2E2E] bg-[#161616] px-3 py-1.5 text-left text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
          >
            🇺🇸 <span className="font-mono text-zinc-500">EN:</span> NASA Mars claim
          </button>
          <button
            type="button"
            onClick={() => loadSample('केंद्र सरकार सभी छात्रों को मुफ्त लैपटॉप और ₹25,000 की छात्रवृत्ति दे रही है।')}
            className="rounded-lg border border-[#2E2E2E] bg-[#161616] px-3 py-1.5 text-left text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
          >
            🇮🇳 <span className="font-mono text-zinc-500">हिंदी:</span> मुफ्त लैपटॉप योजना
          </button>
          <button
            type="button"
            onClick={() => loadSample('WhatsApp forward: RBI ne kaha hai ki kal se sabhi 500 ke note band honge.')}
            className="rounded-lg border border-[#2E2E2E] bg-[#161616] px-3 py-1.5 text-left text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
          >
            🇮🇳 <span className="font-mono text-zinc-500">Hinglish:</span> RBI 500 note rumor
          </button>
        </div>
      </div>
    </div>
  );
};
