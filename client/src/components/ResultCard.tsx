import { DetectionResult } from '@/services/detection';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CredibilitySection } from './CredibilitySection';

interface ResultCardProps {
  result: DetectionResult;
}

export const ResultCard = ({ result }: ResultCardProps) => {
  const { t } = useTranslation();

  const getIcon = () => {
    if (result.classification === 'fake') {
      return <XCircle className="h-6 w-6 text-error flex-shrink-0 mt-0.5" />;
    }
    if (result.classification === 'suspicious') {
      return (
        <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
      );
    }
    return (
      <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
    );
  };

  const getTitle = () => {
    if (result.classification === 'fake') return t('result.fake');
    if (result.classification === 'suspicious') return 'Suspicious';
    return t('result.real');
  };

  return (
    <motion.div
      className="w-full border border-border rounded-lg bg-card p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-4">
        {getIcon()}

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{getTitle()}</h3>
            {result.headline ? (
              <>
                <p className="text-sm font-semibold text-sidebar-foreground">
                  {result.headline}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.input}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{result.input}</p>
            )}
          </div>

          {result.reasoning && result.reasoning.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Analysis:</h4>
              <ul className="space-y-1">
                {result.reasoning.map((reason, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Authenticity Score</span>
              <span className="font-medium">
                {Math.round(result.authenticityScore * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('result.confidence')}
              </span>
              <span className="font-medium">{result.confidence}%</span>
            </div>
          </div>

          {/* Credibility Section */}
          <CredibilitySection credibility={result.credibility} />
        </div>
      </div>
    </motion.div>
  );
};
