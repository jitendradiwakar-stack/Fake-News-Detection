import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AuthService, AccountData } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/UserNav';
import {
  ShieldCheck,
  User as UserIcon,
  Mail,
  Lock,
  Calendar,
  Save,
  LogOut,
  ArrowLeft,
  Loader2,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  BarChart3,
  Shield,
  Clock,
  AtSign,
  Newspaper,
  Sparkles,
  RotateCcw,
  Check,
  Globe,
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_CATEGORIES = [
  'Politics',
  'Technology',
  'Education',
  'Health',
  'Science',
  'Sports',
  'Entertainment',
  'Finance',
  'International News',
  'Social Media Rumors'
];

const PREFERRED_LANGUAGES = [
  { id: 'all', label: 'All Languages' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi (हिंदी)' },
  { id: 'hinglish', label: 'Hinglish' }
];

export const Account: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading states
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Recommendation & Preference states
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || 'all');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.selected_interests || []);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  useEffect(() => {
    loadAccountDetails();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPreferredLanguage(user.preferred_language || 'all');
      setSelectedInterests(user.selected_interests || []);
    }
  }, [user]);

  const loadAccountDetails = async () => {
    setIsLoadingAccount(true);
    try {
      const data = await AuthService.getAccount();
      setAccountData(data);
    } catch (err) {
      console.error('Failed to load account details:', err);
    } finally {
      setIsLoadingAccount(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-emerald-400' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      toast.error('Full name cannot be empty.');
      return;
    }

    if (!trimmedUsername || trimmedUsername.length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await AuthService.updateAccount({
        full_name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
      });
      await refreshUser();
      toast.success('Profile details updated successfully.');
      loadAccountDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile information.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const toggleInterest = (cat: string) => {
    setSelectedInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPreferences(true);
    try {
      await AuthService.updatePreferences({
        preferred_language: preferredLanguage,
        selected_interests: selectedInterests
      });
      await refreshUser();
      toast.success('Recommendation preferences updated successfully.');
    } catch {
      toast.error('Failed to update recommendation preferences.');
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  const handleResetOnboarding = async () => {
    setIsResettingOnboarding(true);
    try {
      await AuthService.resetOnboarding();
      await refreshUser();
      toast.success('Onboarding tutorial reset! Redirecting to dashboard...');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to reset onboarding.');
    } finally {
      setIsResettingOnboarding(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await AuthService.updateAccount({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not available';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const isProfileDirty =
    fullName.trim() !== (user?.full_name || '') ||
    username.trim().toLowerCase() !== (user?.username || '') ||
    email.trim().toLowerCase() !== (user?.email || '');

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#141414]/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <ArrowLeft className="h-4 w-4 text-zinc-400 hover:text-white transition-colors" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 font-bold shadow-sm">
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-mono text-sm font-bold text-white tracking-tight">SatyaCheck</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/feed">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222] flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live Feed</span>
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                Dashboard
              </Button>
            </Link>
            <Link to="/history">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                History
              </Button>
            </Link>
            <ThemeToggle />
            <LanguageToggle />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-6 py-8 sm:px-8 space-y-8">
        
        {/* Page Title & Profile Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#2B2B2B] bg-[#161616] font-mono text-lg font-bold text-white shadow-sm">
              {userInitials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                {user?.full_name || 'Profile Settings'}
              </h1>
              <p className="font-mono text-xs text-zinc-400">
                @{user?.username} • {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="border-[#2B2B2B] bg-[#161616] text-xs text-zinc-300 hover:text-white hover:bg-[#222222]">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-zinc-300" />
                <span>My Analyses</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Profile Information Section */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-zinc-300" />
              <span>Personal Information</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Update your name, public username, and contact email address.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Full Name</Label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="border-[#2E2E2E] bg-[#161616] text-xs text-zinc-100 focus-visible:border-zinc-400"
                disabled={isUpdatingProfile}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label className="font-mono text-xs text-zinc-300 flex items-center gap-1">
                  <AtSign className="h-3 w-3 text-zinc-400" />
                  <span>Username</span>
                </Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="investigator_jane"
                  className="border-[#2E2E2E] bg-[#161616] font-mono text-xs text-zinc-100 focus-visible:border-zinc-400"
                  disabled={isUpdatingProfile}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label className="font-mono text-xs text-zinc-300 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-zinc-400" />
                  <span>Email Address</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="jane@example.com"
                  className="border-[#2E2E2E] bg-[#161616] font-mono text-xs text-zinc-100 focus-visible:border-zinc-400"
                  disabled={isUpdatingProfile}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUpdatingProfile || !isProfileDirty}
              className="gap-2 bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              {isUpdatingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" /> : <Save className="h-3.5 w-3.5" />}
              <span>Save Profile Changes</span>
            </Button>
          </form>
        </div>

        {/* Recommendation Preferences & Topic Interests */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Recommendation &amp; Content Preferences</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize your topic feeds and preferred language to fine-tune personalized fact-check recommendations.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              disabled={isResettingOnboarding}
              className="border-[#2E2E2E] bg-[#161616] text-xs text-zinc-300 hover:text-white hover:bg-[#222222] gap-1.5"
            >
              {isResettingOnboarding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              )}
              <span>Restart Welcome Tutorial</span>
            </Button>
          </div>

          <form onSubmit={handleUpdatePreferences} className="space-y-5">
            {/* Preferred Language */}
            <div className="space-y-2">
              <Label className="font-mono text-xs text-zinc-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                <span>Preferred Content Language</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PREFERRED_LANGUAGES.map((lang) => {
                  const isSelected = preferredLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.id)}
                      className={`rounded-lg border p-2.5 text-center text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 text-white font-semibold'
                          : 'border-[#2B2B2B] bg-[#161616] text-zinc-400 hover:bg-[#202020] hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Interests */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-mono text-xs text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Monitored Topic Interests</span>
                </Label>
                <span className="font-mono text-[11px] text-zinc-400">
                  {selectedInterests.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isSelected = selectedInterests.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleInterest(cat)}
                      className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-950/20 text-white font-medium'
                          : 'border-[#2B2B2B] bg-[#161616] text-zinc-400 hover:border-[#383838] hover:text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUpdatingPreferences}
              className="gap-2 bg-emerald-500 text-zinc-950 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50"
            >
              {isUpdatingPreferences ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save Recommendation Preferences</span>
            </Button>
          </form>
        </div>

        {/* 2. Password & Security Section */}
        <div className="rounded-xl border border-[#2B2B2B] bg-[#1C1C1C] p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-zinc-300" />
              <span>Change Password</span>
            </h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-zinc-300">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-100 focus-visible:border-zinc-400"
                  disabled={isUpdatingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs text-zinc-300">New Password (Min. 8 chars)</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-100 focus-visible:border-zinc-400"
                    disabled={isUpdatingPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-xs text-zinc-300">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10 border-[#2E2E2E] bg-[#161616] text-xs text-zinc-100 focus-visible:border-zinc-400"
                    disabled={isUpdatingPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Password Strength:</span>
                  <span className="font-bold text-zinc-200">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#161616] overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isUpdatingPassword || !newPassword || !currentPassword}
              className="gap-2 bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              {isUpdatingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" /> : <Lock className="h-3.5 w-3.5" />}
              <span>Update Password</span>
            </Button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-400">Log Out of Active Session</h3>
            <p className="text-xs text-zinc-400">Terminates the signed session cookie and clears local storage.</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 border-rose-500/30 bg-rose-950/30 text-xs font-mono text-rose-300 hover:bg-rose-900/50 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>

      </main>
    </div>
  );
};

export default Account;
