import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DetectionResult } from '@/services/detection';
import { Clock, History, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RecentEnquiries } from './RecentEnquiries';

interface SidebarProps {
  enquiries: DetectionResult[];
  onSelect?: (enquiry: DetectionResult) => void;
  onDelete?: (id: string) => void;
  isCollapsed?: boolean;
}

export const Sidebar = ({
  enquiries,
  onSelect,
  onDelete,
  isCollapsed = false,
}: SidebarProps) => {
  const { t } = useTranslation();

  const stats = {
    totalChecks: enquiries.length,
    fakeDetected: enquiries.filter((e) => e.isFake).length,
    realVerified: enquiries.filter((e) => !e.isFake).length,
  };

  return (
    <div className="flex flex-col h-full lg:h-screen">
      {/* Quick Stats */}
      {!isCollapsed && enquiries.length > 0 && (
        <div className="px-4 py-4 border-b border-sidebar-border space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Statistics
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-sidebar-foreground">Total Checks</span>
              <span className="font-semibold text-primary">
                {stats.totalChecks}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sidebar-foreground">Fake Detected</span>
              <span className="font-semibold text-error">
                {stats.fakeDetected}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sidebar-foreground">Real Verified</span>
              <span className="font-semibold text-success">
                {stats.realVerified}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Icons (collapsed) */}
      {isCollapsed && (
        <div className="py-4 space-y-4 border-b border-sidebar-border">
          <div className="flex justify-center">
            <div className="p-2 rounded-lg bg-sidebar-accent/50">
              <History className="h-5 w-5 text-sidebar-foreground" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="p-2 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Checks Section */}
      <div
        className={cn(
          'px-4 py-4 border-b border-sidebar-border',
          isCollapsed && 'px-2 py-3'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            isCollapsed && 'justify-center'
          )}
        >
          <History
            className={cn(
              'text-sidebar-foreground flex-shrink-0',
              isCollapsed ? 'h-5 w-5' : 'h-6 w-6'
            )}
          />
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
              Recent Checks
            </h3>
          )}
        </div>
      </div>

      {/* Recent Enquiries List */}
      <ScrollArea className="flex-1">
        <div className={cn('p-3', isCollapsed && 'p-2')}>
          <RecentEnquiries
            enquiries={enquiries}
            onSelect={onSelect}
            onDelete={onDelete}
            isCollapsed={isCollapsed}
            hideHeader={true}
          />
        </div>
      </ScrollArea>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            Powered by AI Detection
          </p>
        </div>
      )}
    </div>
  );
};
