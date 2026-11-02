import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  UserPlus,
  Loader2,
  Lock,
  User as UserIcon,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const Signup: React.FC = () => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (pw.length >= 12) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-emerald-400' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-400' };
      default:
        return { score: 0, label: 'Very Weak', color: 'bg-red-500' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full name is required.');
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword
      });
      toast.success('Account created successfully! Welcome to SatyaCheck.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account.');
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
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 shadow-xl sm:p-8">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2E2E2E] bg-[#161616] px-3 py-1 font-mono text-[11px] font-semibold text-zinc-300">
              <Sparkles className="h-3 w-3 text-zinc-300" />
              <span>Create Account</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Sign Up for SatyaCheck
            </h1>
            <p className="text-xs text-zinc-400">
              Persistent verification history, analytics dashboard, and exportable reports
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="border-[#2E2E2E] bg-[#161616] pl-9 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-mono text-xs text-zinc-400">@</span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="aarav_sharma"
                  className="border-[#2E2E2E] bg-[#161616] pl-8 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="border-[#2E2E2E] bg-[#161616] pl-9 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="border-[#2E2E2E] bg-[#161616] pl-9 pr-10 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  autoComplete="new-password"
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

              {/* Password Strength Feedback Meter */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-zinc-400">Strength:</span>
                    <span className="font-bold text-zinc-300">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#161616]">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="border-[#2E2E2E] bg-[#161616] pl-9 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400"
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full gap-2 bg-white text-zinc-950 py-2.5 font-semibold text-xs transition-all hover:bg-zinc-200 shadow-sm disabled:opacity-50 rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="border-t border-[#262626] pt-4 text-center text-xs text-zinc-400">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-semibold text-white hover:underline underline-offset-4"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
