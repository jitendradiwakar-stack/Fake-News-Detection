import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './i18n/config';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/History';
import Account from './pages/Account';
import About from './pages/About';
import HowToUse from './pages/HowToUse';
import FactCheckFeed from './pages/FactCheckFeed';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/feed" element={<FactCheckFeed />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-to-use" element={<HowToUse />} />
                <Route path="/how-it-works" element={<HowToUse />} />

                {/* Authenticated Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
