import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface NewsInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

export const NewsInput = ({ onSubmit, isLoading }: NewsInputProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error(t('input.validation.empty'));
      return;
    }

    if (input.trim().length < 10) {
      toast.error(t('input.validation.invalid'));
      return;
    }

    onSubmit(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative border border-border rounded-lg bg-card shadow-sm focus-within:border-primary/50 transition-colors">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('input.placeholder')}
          className="min-h-[100px] resize-none border-0 focus-visible:ring-0 pr-12 text-base"
          disabled={isLoading}
        />
        <div className="absolute bottom-3 right-3">
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-8 w-8 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
