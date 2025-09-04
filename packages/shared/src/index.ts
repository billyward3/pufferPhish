// Shared types and utilities for PufferPhish

export interface PhishingReport {
  id: string;
  url: string;
  title?: string;
  detectedAt: Date;
  confidence: number;
  features: {
    urlFeatures: Record<string, any>;
    domFeatures: Record<string, any>;
    contentFeatures: Record<string, any>;
  };
}

export interface UserSettings {
  autoBlock: boolean;
  notifications: boolean;
  whitelistedDomains: string[];
}

export const CONFIDENCE_THRESHOLD = 0.7;
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';