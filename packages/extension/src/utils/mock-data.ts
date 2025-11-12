/**
 * Mock Data Provider
 * Provides sample data for demo mode
 */

import type {
  AnalysisResponse,
  StatsResponse,
  SettingsResponse,
  FeedbackResponse,
} from '../types/api';

export const mockSafeAnalysis: AnalysisResponse = {
  id: `mock-safe-${Date.now()}`,
  url: 'https://google.com',
  domain: 'google.com',
  riskScore: 0.05,
  threats: {
    phishing: 0.02,
    malware: 0.01,
    social: 0.02,
  },
  blocked: false,
  source: 'whitelist',
  confidence: 1.0,
  timestamp: new Date().toISOString(),
  message: 'Domain is on safe list',
};

export const mockWarningAnalysis: AnalysisResponse = {
  id: `mock-warning-${Date.now()}`,
  url: 'https://suspicious-site.example.com',
  domain: 'suspicious-site.example.com',
  riskScore: 0.55,
  threats: {
    phishing: 0.4,
    malware: 0.2,
    social: 0.6,
  },
  blocked: false,
  source: 'ml-analysis',
  confidence: 0.8,
  modelVersion: '1.0.0-mock',
  processingTime: 125,
  timestamp: new Date().toISOString(),
  message: 'Moderate risk detected - exercise caution',
};

export const mockDangerAnalysis: AnalysisResponse = {
  id: `mock-danger-${Date.now()}`,
  url: 'https://phishing-site.malicious.com',
  domain: 'phishing-site.malicious.com',
  riskScore: 0.92,
  threats: {
    phishing: 0.95,
    malware: 0.85,
    social: 0.90,
  },
  blocked: true,
  source: 'ml-analysis',
  confidence: 0.95,
  modelVersion: '1.0.0-mock',
  processingTime: 243,
  timestamp: new Date().toISOString(),
  message: 'High risk phishing site detected - navigation blocked',
};

export const mockStats: StatsResponse = {
  totalScans: 127,
  threatsBlocked: 8,
  avgRiskScore: 0.23,
  safeScans: 119,
  recentAnalyses: [
    {
      id: 'mock-1',
      url: 'https://github.com',
      domain: 'github.com',
      riskScore: 0.02,
      threats: { phishing: 0.01, malware: 0.01, social: 0.02 },
      blocked: false,
      source: 'whitelist',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'mock-2',
      url: 'https://stackoverflow.com',
      domain: 'stackoverflow.com',
      riskScore: 0.03,
      threats: { phishing: 0.01, malware: 0.02, social: 0.03 },
      blocked: false,
      source: 'whitelist',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'mock-3',
      url: 'https://suspicious-link.example.com',
      domain: 'suspicious-link.example.com',
      riskScore: 0.87,
      threats: { phishing: 0.92, malware: 0.75, social: 0.88 },
      blocked: true,
      source: 'ml-analysis',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ],
};

export const mockSettings: SettingsResponse = {
  autoBlock: true,
  notifications: true,
  whitelistedDomains: ['example.com', 'trusted-site.org'],
};

export const mockFeedback: FeedbackResponse = {
  id: `mock-feedback-${Date.now()}`,
  analysisId: 'mock-analysis-123',
  correct: true,
  actualThreat: null,
  comment: 'Thank you for your feedback!',
  timestamp: new Date().toISOString(),
  message: 'Feedback submitted successfully',
};

/**
 * Get mock analysis based on URL pattern
 */
export function getMockAnalysisForURL(url: string): AnalysisResponse {
  const urlLower = url.toLowerCase();

  // Simulate whitelisted domains
  const whitelist = [
    'google.com',
    'github.com',
    'stackoverflow.com',
    'mozilla.org',
    'wikipedia.org',
  ];

  const domain = new URL(url).hostname.replace('www.', '');

  if (whitelist.some((d) => domain.includes(d))) {
    return {
      ...mockSafeAnalysis,
      url,
      domain,
      timestamp: new Date().toISOString(),
    };
  }

  // Simulate dangerous patterns
  if (
    urlLower.includes('phish') ||
    urlLower.includes('malicious') ||
    urlLower.includes('scam')
  ) {
    return {
      ...mockDangerAnalysis,
      url,
      domain,
      timestamp: new Date().toISOString(),
    };
  }

  // Default to warning level
  return {
    ...mockWarningAnalysis,
    url,
    domain,
    timestamp: new Date().toISOString(),
  };
}
