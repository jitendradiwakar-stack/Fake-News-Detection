import { LanguageToggle } from '@/components/LanguageToggle';
import { NewsInput } from '@/components/NewsInput';
import { RecentEnquiries } from '@/components/RecentEnquiries';
import { ResultCard } from '@/components/ResultCard';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  deleteEnquiry,
  DetectionResult,
  detectNews,
  getRecentEnquiries,
} from '@/services/detection';
import { motion } from 'framer-motion';
import { Info, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Index = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<DetectionResult[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] =
    useState(false);

  useEffect(() => {
    loadRecentEnquiries();
  }, []);

  const loadRecentEnquiries = async () => {
    try {
      const enquiries = await getRecentEnquiries();
      setRecentEnquiries(enquiries);
    } catch (error) {
      console.error('Failed to load recent enquiries:', error);
    }
  };

  const handleSubmit = async (input: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const detectionResult = await detectNews(input);
      setResult(detectionResult);
      // Reload from localStorage to get the updated list
      await loadRecentEnquiries();

      const message =
        detectionResult.classification === 'fake'
          ? t('result.fake')
          : detectionResult.classification === 'suspicious'
          ? 'Suspicious content detected'
          : t('result.real');
      toast.success(message);
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to analyze news. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEnquiry = (enquiry: DetectionResult) => {
    setResult(enquiry);
    setIsSidebarOpen(false);
  };

  const handleDeleteEnquiry = (id: string) => {
    const updated = deleteEnquiry(id);
    setRecentEnquiries(updated);
    toast.success('Query deleted');
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - Always visible, collapsible */}
      <aside
        className={cn(
          'hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:z-20 border-r border-sidebar-border flex-col bg-sidebar transition-all duration-300 ease-in-out',
          isDesktopSidebarExpanded ? 'w-64' : 'w-16'
        )}
        onMouseEnter={() => setIsDesktopSidebarExpanded(true)}
        onMouseLeave={() => setIsDesktopSidebarExpanded(false)}
      >
        <Sidebar
          enquiries={recentEnquiries}
          onSelect={handleSelectEnquiry}
          onDelete={handleDeleteEnquiry}
          isCollapsed={!isDesktopSidebarExpanded}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <RecentEnquiries
            enquiries={recentEnquiries}
            onSelect={handleSelectEnquiry}
            onDelete={handleDeleteEnquiry}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-sm font-semibold lg:hidden">
              {t('app.title')}
            </h1>

            {/* Desktop site info and links */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {t('app.title')}
                </span>
              </div>
              <nav className="flex items-center gap-1">
                <Link to="/about">
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    About
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    How it Works
                  </Button>
                </Link>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl mx-auto space-y-8">
            {!result && (
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-3xl font-normal mb-2">
                  {t('app.subtitle')}
                </h2>
              </motion.div>
            )}

            <NewsInput onSubmit={handleSubmit} isLoading={isLoading} />

            {result && <ResultCard result={result} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
