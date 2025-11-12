/**
 * API Type Definitions
 * Shared interfaces for API requests and responses
 */

export interface ThreatDetails {
  phishing: number;
  malware: number;
  social: number;
}

export interface AnalysisResponse {
  id: string;
  url: string;
  domain: string;
  riskScore: number;
  threats: ThreatDetails;
  blocked: boolean;
  source: string;
  confidence?: number;
  modelVersion?: string;
  processingTime?: number;
  timestamp: string;
  message?: string;
}

export interface StatsResponse {
  totalScans: number;
  threatsBlocked: number;
  avgRiskScore: number;
  safeScans: number;
  recentAnalyses: Array<{
    id: string;
    url: string;
    domain: string;
    riskScore: number;
    threats: ThreatDetails;
    blocked: boolean;
    source: string;
    timestamp: string;
  }>;
}

export interface SettingsResponse {
  autoBlock: boolean;
  notifications: boolean;
  whitelistedDomains: string[];
  message?: string;
}

export interface SettingsUpdateRequest {
  autoBlock?: boolean;
  notifications?: boolean;
  whitelistedDomains?: string[];
}

export interface FeedbackRequest {
  analysisId: string;
  correct: boolean;
  actualThreat?: string;
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  analysisId: string;
  correct: boolean;
  actualThreat: string | null;
  comment: string | null;
  timestamp: string;
  message?: string;
}

export interface APIError {
  error: string;
  message?: string;
  details?: any;
}
