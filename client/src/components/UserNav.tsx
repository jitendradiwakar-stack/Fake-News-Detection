import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Newspaper,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

export const UserNav: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#222222]"
          >
            <LogIn className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Log In</span>
          </Button>
        </Link>
        <Link to="/signup">
          <Button
            size="sm"
            className="btn-verify-claim h-8 gap-1.5 bg-zinc-950 dark:bg-white px-3 text-xs sm:text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg shadow-xs transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Sign Up</span>
          </Button>
        </Link>
      </div>
    );
  }

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-[#2B2B2B] bg-[#161616] px-2 text-xs font-mono text-zinc-200 hover:border-zinc-500 hover:bg-[#222222]"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white border border-zinc-700">
            {initials}
          </div>
          <span className="max-w-[100px] truncate text-xs font-medium hidden sm:inline text-zinc-200">
            {user.full_name.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-[#2B2B2B] bg-[#1C1C1C] p-1.5 text-zinc-200 shadow-2xl backdrop-blur-md"
      >
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold text-white">{user.full_name}</p>
            <p className="text-[11px] font-mono text-zinc-400 truncate">@{user.username}</p>
            <p className="text-[10px] font-mono text-zinc-400 truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#2B2B2B]" />
        
        <DropdownMenuItem asChild className="cursor-pointer text-xs hover:bg-[#282828] text-zinc-200 focus:bg-[#282828] focus:text-white">
          <Link to="/feed" className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
            <span>Live Fact-Check Feed</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer text-xs hover:bg-[#282828] text-zinc-200 focus:bg-[#282828] focus:text-white">
          <Link to="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400" />
            <span>User Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer text-xs hover:bg-[#282828] text-zinc-200 focus:bg-[#282828] focus:text-white">
          <Link to="/history" className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-zinc-400" />
            <span>Prediction History</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer text-xs hover:bg-[#282828] text-zinc-200 focus:bg-[#282828] focus:text-white">
          <Link to="/account" className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer text-xs hover:bg-[#282828] text-zinc-200 focus:bg-[#282828] focus:text-white">
          <Link to="/how-to-use" className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            <span>How to Use Guide</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#2B2B2B]" />
        
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 focus:bg-red-950/40 focus:text-red-300"
        >
          <div className="flex items-center gap-2">
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
