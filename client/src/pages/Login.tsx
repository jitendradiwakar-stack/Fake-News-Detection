import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Lock,
  User as UserIcon,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Please enter your email or username.');
      return;
    }

    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      await login({ identifier: identifier.trim(), password });
      toast.success('Welcome back to SatyaCheck!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#121212] text-zinc-100">
      
      {/* Top Header */}
      <header className="border-b border-[#262626] bg-[#141414]/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <ArrowLeft className="h-4 w-4 text-zinc-400 hover:text-white" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 font-bold shadow-sm">
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-mono text-sm font-bold text-white tracking-tight">SatyaCheck</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 shadow-xl sm:p-8">
          
          {/* Form Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2E2E2E] bg-[#161616] px-3 py-1 font-mono text-[11px] font-semibold text-zinc-300">
              <Sparkles className="h-3 w-3 text-zinc-300" />
              <span>Secure Authentication</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Log In to SatyaCheck
            </h1>
            <p className="text-xs text-zinc-400">
              Access your personalized forensic dashboard and saved predictions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">
                Email or Username
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or username"
                  className="border-[#2E2E2E] bg-[#161616] pl-9 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="font-mono text-xs text-zinc-300">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-[#2E2E2E] bg-[#161616] pl-9 pr-10 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 bg-white text-zinc-950 py-2.5 font-semibold text-xs transition-all hover:bg-zinc-200 shadow-sm disabled:opacity-50 rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </>
              )}
            </Button>
          </form>

          {/* Switch to Signup */}
          <div className="border-t border-[#262626] pt-4 text-center text-xs text-zinc-400">
            <span>Don't have an account yet? </span>
            <Link
              to="/signup"
              className="font-semibold text-white hover:underline underline-offset-4"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
