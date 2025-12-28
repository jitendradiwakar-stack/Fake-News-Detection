import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DetectionResult } from '@/services/detection';
import { AlertTriangle, CheckCircle, Trash2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RecentEnquiriesProps {
  enquiries: DetectionResult[];
  onSelect?: (enquiry: DetectionResult) => void;
  onDelete?: (id: string) => void;
  isCollapsed?: boolean;
  hideHeader?: boolean;
}

export const RecentEnquiries = ({
  enquiries,
  onSelect,
  onDelete,
  isCollapsed = false,
  hideHeader = false,
}: RecentEnquiriesProps) => {
  const { t } = useTranslation();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  const truncateText = (text: string, maxLength: number = 140) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TooltipProvider delayDuration={300}>
      {hideHeader ? (
        <div className={cn(isCollapsed && 'space-y-3')}>
          {enquiries.length === 0 ? (
            <div
              className={cn(
                'text-center text-sm text-muted-foreground py-8 px-4',
                isCollapsed && 'px-2'
              )}
            >
              {isCollapsed ? '—' : t('sidebar.empty')}
            </div>
          ) : (
            enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className={cn('relative group mb-2', isCollapsed && 'mb-3')}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect?.(enquiry)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-all duration-200',
                        'flex items-center gap-3 border border-transparent',
                        'hover:bg-sidebar-accent hover:border-sidebar-border',
                        isCollapsed && 'p-2 justify-center'
                      )}
                      style={{ overflow: 'hidden' }}
                    >
                      {isCollapsed ? (
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            enquiry.classification === 'fake'
                              ? 'bg-error'
                              : enquiry.classification === 'suspicious'
                              ? 'bg-warning'
                              : 'bg-success'
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            'p-1.5 rounded-md flex-shrink-0',
                            enquiry.classification === 'fake'
                              ? 'bg-error/10'
                              : enquiry.classification === 'suspicious'
                              ? 'bg-warning/10'
                              : 'bg-success/10'
                          )}
                        >
                          {enquiry.classification === 'fake' ? (
                            <XCircle className="h-4 w-4 text-error" />
                          ) : enquiry.classification === 'suspicious' ? (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                      )}

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
                          <p
                            className="text-sm mb-1 text-sidebar-foreground leading-relaxed whitespace-normal break-words font-medium"
                            style={{
                              maxWidth: 'calc(100% - 56px)',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {truncateText(enquiry.input, 140)}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={cn(
                                'font-semibold px-2 py-0.5 rounded-full',
                                enquiry.classification === 'fake'
                                  ? 'bg-error/10 text-error'
                                  : enquiry.classification === 'suspicious'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-success/10 text-success'
                              )}
                            >
                              {enquiry.classification === 'fake'
                                ? t('status.fake')
                                : enquiry.classification === 'suspicious'
                                ? 'Suspicious'
                                : t('status.real')}
                            </span>
                            <span className="text-muted-foreground">
                              {formatTime(enquiry.timestamp)}
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  {enquiry.input.length > 140 && !isCollapsed && (
                    <TooltipContent
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="max-w-sm bg-popover border-border shadow-lg"
                    >
                      <p className="text-xs leading-relaxed">{enquiry.input}</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {!isCollapsed && onDelete && (
                  <button
                    onClick={(e) => handleDelete(e, enquiry.id)}
                    className={cn(
                      'absolute top-2 right-2 p-1.5 rounded-md',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                    )}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1">
            <div className={cn('p-3', isCollapsed && 'p-2')}>
              {enquiries.length === 0 ? (
                <div
                  className={cn(
                    'text-center text-sm text-muted-foreground py-8 px-4',
                    isCollapsed && 'px-2'
                  )}
                >
                  {isCollapsed ? '—' : t('sidebar.empty')}
                </div>
              ) : (
                enquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    className={cn('relative group mb-2', isCollapsed && 'mb-3')}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onSelect?.(enquiry)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg transition-all duration-200',
                            'flex items-center gap-3 border border-transparent',
                            'hover:bg-sidebar-accent hover:border-sidebar-border',
                            isCollapsed && 'p-2 justify-center'
                          )}
                        >
                          {isCollapsed ? (
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                enquiry.classification === 'fake'
                                  ? 'bg-error'
                                  : enquiry.classification === 'suspicious'
                                  ? 'bg-warning'
                                  : 'bg-success'
                              )}
                            />
                          ) : (
                            <div
                              className={cn(
                                'p-1.5 rounded-md flex-shrink-0',
                                enquiry.classification === 'fake'
                                  ? 'bg-error/10'
                                  : enquiry.classification === 'suspicious'
                                  ? 'bg-warning/10'
                                  : 'bg-success/10'
                              )}
                            >
                              {enquiry.classification === 'fake' ? (
                                <XCircle className="h-4 w-4 text-error" />
                              ) : enquiry.classification === 'suspicious' ? (
                                <AlertTriangle className="h-4 w-4 text-warning" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-success" />
                              )}
                            </div>
                          )}

                          {!isCollapsed && (
                            <div
                              className="flex-1 min-w-0"
                              style={{ minWidth: 0 }}
                            >
                              <p
                                className="text-sm mb-1 text-sidebar-foreground leading-relaxed whitespace-normal break-words font-medium"
                                style={{
                                  maxWidth: 'calc(100% - 56px)',
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {truncateText(enquiry.input, 140)}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={cn(
                                    'font-semibold px-2 py-0.5 rounded-full',
                                    enquiry.classification === 'fake'
                                      ? 'bg-error/10 text-error'
                                      : enquiry.classification === 'suspicious'
                                      ? 'bg-warning/10 text-warning'
                                      : 'bg-success/10 text-success'
                                  )}
                                >
                                  {enquiry.classification === 'fake'
                                    ? t('status.fake')
                                    : enquiry.classification === 'suspicious'
                                    ? 'Suspicious'
                                    : t('status.real')}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatTime(enquiry.timestamp)}
                                </span>
                              </div>
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      {enquiry.input.length > 140 && !isCollapsed && (
                        <TooltipContent
                          side="right"
                          align="start"
                          sideOffset={10}
                          className="max-w-sm bg-popover border-border shadow-lg"
                        >
                          <p className="text-xs leading-relaxed">
                            {enquiry.input}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {!isCollapsed && onDelete && (
                      <button
                        onClick={(e) => handleDelete(e, enquiry.id)}
                        className={cn(
                          'absolute top-2 right-2 p-1.5 rounded-md',
                          'opacity-0 group-hover:opacity-100 transition-opacity',
                          'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                        )}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </TooltipProvider>
  );
};
