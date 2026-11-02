import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultCard } from '../components/ResultCard';
import { DetectionResult } from '../services/detection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'result.fake': 'Misinformation Detected',
        'result.real': 'Verified Authentic Claim',
        'result.suspicious': 'Potentially Misleading',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
}));

vi.mock('../components/CredibilitySection', () => ({
  CredibilitySection: () => <div data-testid="credibility-section">Credibility Section</div>,
}));

describe('ResultCard Component', () => {
  it('renders fake news badge with appropriate alert styles for fake prediction', () => {
    const fakeResult: DetectionResult = {
      classification: 'fake',
      authenticityScore: 0.12,
      confidence: 88,
      input: 'Fake asteroid hitting Earth tomorrow',
      headline: 'Fake asteroid hitting Earth tomorrow',
      detectedLanguage: 'en',
      languageName: 'English',
      xaiKeywords: ['asteroid', 'tomorrow'],
      sourcesFound: [],
    };

    render(<ResultCard result={fakeResult} />);
    expect(screen.getByText('Misinformation Detected')).toBeInTheDocument();
  });

  it('renders authentic news badge for authentic prediction', () => {
    const authenticResult: DetectionResult = {
      classification: 'authentic',
      authenticityScore: 0.94,
      confidence: 94,
      input: 'NASA successfully tests next-generation lunar rover',
      headline: 'NASA successfully tests next-generation lunar rover',
      detectedLanguage: 'en',
      languageName: 'English',
      xaiKeywords: ['NASA', 'rover'],
      sourcesFound: [],
    };

    render(<ResultCard result={authenticResult} />);
    expect(screen.getByText('Verified Authentic Claim')).toBeInTheDocument();
  });
});
