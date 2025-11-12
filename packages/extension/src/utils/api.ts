/**
 * API Client
 * Handles all API communication with support for demo mode
 */

import type {
  AnalysisResponse,
  StatsResponse,
  SettingsResponse,
  SettingsUpdateRequest,
  FeedbackRequest,
  FeedbackResponse,
  APIError,
} from '../types/api';
import {
  getMockAnalysisForURL,
  mockStats,
  mockSettings,
  mockFeedback,
} from './mock-data';

// Configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const DEMO_MODE = process.env.VITE_DEMO_MODE === 'true';
const API_TIMEOUT = 5000; // 5 seconds

/**
 * Helper to make API requests with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Analyze a URL for phishing threats
 */
export async function analyzeURL(url: string): Promise<AnalysisResponse> {
  if (DEMO_MODE) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return getMockAnalysisForURL(url);
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(error.message || error.error || 'Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (analyzeURL):', error);
    // Fallback to mock data on error
    return getMockAnalysisForURL(url);
  }
}

/**
 * Get user statistics
 */
export async function getStats(): Promise<StatsResponse> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStats;
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/stats`);

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch stats');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (getStats):', error);
    return mockStats;
  }
}

/**
 * Get user settings
 */
export async function getSettings(): Promise<SettingsResponse> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockSettings;
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/settings`);

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(
        error.message || error.error || 'Failed to fetch settings'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (getSettings):', error);
    return mockSettings;
  }
}

/**
 * Update user settings
 */
export async function updateSettings(
  settings: SettingsUpdateRequest
): Promise<SettingsResponse> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...mockSettings, ...settings };
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(
        error.message || error.error || 'Failed to update settings'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (updateSettings):', error);
    throw error;
  }
}

/**
 * Submit feedback on an analysis
 */
export async function submitFeedback(
  feedback: FeedbackRequest
): Promise<FeedbackResponse> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      ...mockFeedback,
      ...feedback,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(
        error.message || error.error || 'Failed to submit feedback'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (submitFeedback):', error);
    throw error;
  }
}

/**
 * Check if API is reachable
 */
export async function checkAPIHealth(): Promise<boolean> {
  if (DEMO_MODE) {
    return true;
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/health`, {}, 2000);
    return response.ok;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
}

/**
 * Get current API configuration
 */
export function getAPIConfig() {
  return {
    url: API_URL,
    demoMode: DEMO_MODE,
    timeout: API_TIMEOUT,
  };
}
