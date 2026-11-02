import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'labeled' | 'rail';
}

export const ThemeToggle = ({ className, variant = 'icon' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'rail') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300',
          'border border-transparent hover:border-zinc-500/30',
          isDark 
            ? 'text-amber-400 hover:bg-[#1C1C1C] hover:text-amber-300' 
            : 'text-indigo-600 hover:bg-zinc-200/80 hover:text-indigo-700',
          className
        )}
        title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      >
        <div className="relative h-4 w-4">
          <Sun
            className={cn(
              'absolute inset-0 h-4 w-4 transition-all duration-300 transform',
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-amber-500'
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 h-4 w-4 transition-all duration-300 transform',
              isDark ? 'rotate-0 scale-100 opacity-100 text-zinc-300' : '-rotate-90 scale-0 opacity-0'
            )}
          />
        </div>
      </button>
    );
  }

  if (variant === 'labeled') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className={cn(
          'h-8 gap-2 border-[#2B2B2B] bg-[#161616] px-2.5 text-xs font-mono font-medium transition-all duration-300',
          isDark ? 'text-zinc-200 hover:text-white hover:bg-[#222222]' : 'text-zinc-800 hover:text-black hover:bg-zinc-100',
          className
        )}
        title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      >
        <div className="relative h-3.5 w-3.5 flex items-center justify-center">
          <Sun
            className={cn(
              'absolute inset-0 h-3.5 w-3.5 transition-all duration-300 transform',
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-amber-500'
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 h-3.5 w-3.5 transition-all duration-300 transform',
              isDark ? 'rotate-0 scale-100 opacity-100 text-zinc-300' : '-rotate-90 scale-0 opacity-0'
            )}
          />
        </div>
        <span className="capitalize">{theme}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={cn(
        'h-8 w-8 p-0 border-[#2B2B2B] bg-[#161616] transition-all duration-300',
        isDark 
          ? 'text-zinc-300 hover:text-white hover:bg-[#222222] hover:border-zinc-500' 
          : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 hover:border-zinc-400',
        className
      )}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      <div className="relative h-4 w-4">
        <Sun
          className={cn(
            'absolute inset-0 h-4 w-4 transition-all duration-300 transform',
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-amber-500'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 h-4 w-4 transition-all duration-300 transform',
            isDark ? 'rotate-0 scale-100 opacity-100 text-zinc-300' : '-rotate-90 scale-0 opacity-0'
          )}
        />
      </div>
    </Button>
  );
};
