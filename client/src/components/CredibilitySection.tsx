import { CredibilityData } from '@/services/detection';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface CredibilitySectionProps {
  credibility?: CredibilityData;
}

export const CredibilitySection = ({
  credibility,
}: CredibilitySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!credibility || credibility.total_found === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Found on {credibility.total_found} Trusted Portal
            {credibility.total_found > 1 ? 's' : ''}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {credibility.found_sources.map((source, index) => (
                <motion.a
                  key={`${source.domain}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-md border border-border hover:bg-accent/50 hover:border-primary/50 transition-all group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <img
                    src={source.favicon}
                    alt={`${source.portal_name} favicon`}
                    className="w-5 h-5 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {source.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {source.portal_name}
                    </p>
                  </div>

                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              These results are from trusted news portals found on search
              engines
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
