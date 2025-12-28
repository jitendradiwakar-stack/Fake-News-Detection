import { apiClient } from './api';
import { StorageService } from './storage';

export interface CredibilitySource {
  portal_name: string;
  url: string;
  title: string;
  favicon: string;
  domain: string;
}

export interface CredibilityData {
  found_sources: CredibilitySource[];
  total_found: number;
  error?: string;
}

export interface DetectionResult {
  id: string;
  input: string;
  queryType: 'headline' | 'url';
  isFake: boolean;
  confidence: number;
  authenticityScore: number;
  classification: 'authentic' | 'suspicious' | 'fake';
  reasoning: string[];
  analyzedText?: string;
  headline?: string;
  timestamp: Date;
  credibility?: CredibilityData;
  credibilityBoost?: {
    applied: boolean;
    boost_amount: number;
    sources_found: number;
  };
}

interface DetectionAPIResponse {
  prediction: number;
  probabilities: {
    fake: number;
    authentic: number;
  };
  headline?: string;
  credibility_boost?: {
    applied: boolean;
    boost_amount: number;
    sources_found: number;
  };
}

function isURL(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function classifyFromProbabilities(probabilities: {
  fake: number;
  authentic: number;
}): 'authentic' | 'suspicious' | 'fake' {
  const authenticScore = probabilities.authentic;

  if (authenticScore >= 0.7) {
    return 'authentic';
  } else if (authenticScore >= 0.4) {
    return 'suspicious';
  } else {
    return 'fake';
  }
}

function generateReasoning(
  probabilities: { fake: number; authentic: number },
  prediction: number
): string[] {
  const reasoning: string[] = [];
  const confidence = Math.max(probabilities.fake, probabilities.authentic);

  if (prediction === 1) {
    reasoning.push(
      `Model predicts this is AUTHENTIC news with ${(
        probabilities.authentic * 100
      ).toFixed(1)}% confidence`
    );
    if (probabilities.authentic > 0.8) {
      reasoning.push('High authenticity score indicates reliable content');
    }
  } else {
    reasoning.push(
      `Model predicts this is FAKE news with ${(
        probabilities.fake * 100
      ).toFixed(1)}% confidence`
    );
    if (probabilities.fake > 0.8) {
      reasoning.push(
        'High fake score indicates potentially misleading content'
      );
    }
  }

  if (confidence < 0.6) {
    reasoning.push('Low confidence - treat this result with caution');
  }

  return reasoning;
}

function mapAPIResponseToResult(
  response: DetectionAPIResponse,
  input: string,
  queryType: 'headline' | 'url'
): DetectionResult {
  const classification = classifyFromProbabilities(response.probabilities);
  const confidence = Math.max(
    response.probabilities.fake,
    response.probabilities.authentic
  );
  const reasoning = generateReasoning(
    response.probabilities,
    response.prediction
  );

  // Add credibility boost reasoning if applied
  if (response.credibility_boost?.applied) {
    const boost = response.credibility_boost.boost_amount;
    const sources = response.credibility_boost.sources_found;
    reasoning.push(
      `Authenticity score boosted by ${(boost * 100).toFixed(
        0
      )}% due to ${sources} reputable source${sources > 1 ? 's' : ''} found`
    );
  }

  return {
    id: Date.now().toString(),
    input,
    queryType,
    isFake: response.prediction === 0,
    confidence: Math.round(confidence * 100),
    authenticityScore: response.probabilities.authentic,
    classification,
    reasoning,
    analyzedText: input,
    headline: response.headline,
    timestamp: new Date(),
    credibilityBoost: response.credibility_boost,
  };
}

export const checkCredibility = async (
  headline: string
): Promise<CredibilityData> => {
  try {
    const response = await apiClient.post<CredibilityData>(
      '/credibility-check',
      {
        headline: headline,
      }
    );
    return response;
  } catch (error) {
    console.error('Credibility check error:', error);
    return {
      found_sources: [],
      total_found: 0,
      error: 'Failed to check credibility',
    };
  }
};

export const detectNews = async (input: string): Promise<DetectionResult> => {
  const queryType = isURL(input) ? 'url' : 'headline';

  const response = await apiClient.post<DetectionAPIResponse>('/detector', {
    input: input,
  });

  const result = mapAPIResponseToResult(response, input, queryType);

  // Fetch credibility data for display (boosting already done by backend)
  try {
    const headline = response.headline || input;
    const credibilityData = await checkCredibility(headline);
    result.credibility = credibilityData;
  } catch (error) {
    console.error('Failed to check credibility:', error);
    // Continue without credibility data
  }

  StorageService.addResult(result);

  return result;
};

export const getRecentEnquiries = async (): Promise<DetectionResult[]> => {
  return StorageService.loadResults();
};

export const deleteEnquiry = (id: string): DetectionResult[] => {
  return StorageService.deleteResult(id);
};

export const clearAllEnquiries = (): void => {
  StorageService.clearHistory();
};
