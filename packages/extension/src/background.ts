/**
 * Background Service Worker
 * Handles URL analysis, storage, and communication between components
 */

import { analyzeURL, getStats, getSettings, updateSettings } from './utils/api';
import type { AnalysisResponse, SettingsResponse } from './types/api';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Extension icon paths
const ICON_PATHS = {
  safe: {
    '16': 'images/logo-16.png',
    '32': 'images/logo-32.png',
    '48': 'images/logo-64.png',
    '128': 'images/logo-128.png',
  },
  danger: {
    '16': 'images/bad.png',
    '32': 'images/bad.png',
    '48': 'images/bad.png',
    '128': 'images/bad.png',
  },
};

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('PufferPhish extension installed');

  // Initialize default settings
  try {
    const settings = await getSettings();
    await chrome.storage.sync.set({ settings });
    console.log('Settings initialized:', settings);
  } catch (error) {
    console.error('Failed to initialize settings:', error);
  }
});

/**
 * Track URLs being analyzed to prevent re-analysis loops
 */
const analyzingUrls = new Set<string>();

/**
 * Analyze URL when tab is updated - intercept on 'loading' status
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Intercept when page starts loading (before content loads)
  if (changeInfo.status === 'loading' && tab.url) {
    const url = tab.url;

    // Skip chrome://, extension pages, and our warning page
    if (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.includes('/warning.html') ||
      url === 'https://www.google.com/' ||
      url === 'https://www.google.com' ||
      analyzingUrls.has(url)
    ) {
      return;
    }

    try {
      // Mark URL as being analyzed
      analyzingUrls.add(url);

      // Analyze URL
      const analysis = await analyzeAndStoreURL(url, tabId);

      console.log('Analysis complete:', { url, riskScore: analysis.riskScore });

      // If high risk (70%+), redirect to warning page
      if (analysis.riskScore >= 0.7) {
        const result = await chrome.storage.sync.get('settings');
        const settings: SettingsResponse = result.settings || {
          autoBlock: true,
          notifications: true,
          whitelistedDomains: [],
        };

        if (settings.autoBlock) {
          console.log('High risk detected, redirecting to warning page');

          // Build warning page URL with data
          const warningURL = chrome.runtime.getURL('warning.html') +
            `?url=${encodeURIComponent(url)}` +
            `&data=${encodeURIComponent(JSON.stringify(analysis))}`;

          // Redirect to warning page
          await chrome.tabs.update(tabId, { url: warningURL });
        }
      }
    } catch (error) {
      console.error('Error analyzing URL on navigation:', error);
    } finally {
      // Remove from analyzing set after a delay
      setTimeout(() => analyzingUrls.delete(url), 5000);
    }
  }

  // Update icon when page finishes loading
  if (changeInfo.status === 'complete' && tab.url) {
    if (
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('chrome-extension://')
    ) {
      try {
        const result = await chrome.storage.local.get('currentAnalysis');
        if (result.currentAnalysis) {
          await updateExtensionIcon(result.currentAnalysis.riskScore, tabId);
        }
      } catch (error) {
        console.error('Error updating icon:', error);
      }
    }
  }
});

/**
 * Analyze URL and store result
 */
async function analyzeAndStoreURL(
  url: string,
  tabId?: number
): Promise<AnalysisResponse> {
  console.log('Analyzing URL:', url);

  try {
    // Check cache first
    const cached = await getCachedAnalysis(url);
    if (cached) {
      console.log('Using cached analysis for:', url);
      await updateExtensionIcon(cached.riskScore, tabId);
      await notifyContentScript(cached, tabId);
      return cached;
    }

    // Perform analysis
    const analysis = await analyzeURL(url);
    console.log('Analysis result:', analysis);

    // Store in cache
    await cacheAnalysis(url, analysis);

    // Store current analysis
    await chrome.storage.local.set({
      currentAnalysis: analysis,
      lastAnalyzedURL: url,
      lastAnalyzedTime: Date.now(),
    });

    // Update extension icon
    await updateExtensionIcon(analysis.riskScore, tabId);

    // Notify content script if dangerous
    await notifyContentScript(analysis, tabId);

    return analysis;
  } catch (error) {
    console.error('Failed to analyze URL:', error);
    throw error;
  }
}

/**
 * Get cached analysis if available and not expired
 */
async function getCachedAnalysis(
  url: string
): Promise<AnalysisResponse | null> {
  try {
    const result = await chrome.storage.local.get('analysisCache');
    const cache = result.analysisCache || {};

    const cached = cache[url];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.analysis;
    }

    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Cache analysis result
 */
async function cacheAnalysis(
  url: string,
  analysis: AnalysisResponse
): Promise<void> {
  try {
    const result = await chrome.storage.local.get('analysisCache');
    const cache = result.analysisCache || {};

    cache[url] = {
      analysis,
      timestamp: Date.now(),
    };

    // Keep only last 50 cached URLs
    const urls = Object.keys(cache);
    if (urls.length > 50) {
      const sortedUrls = urls
        .sort((a, b) => cache[b].timestamp - cache[a].timestamp)
        .slice(0, 50);
      const newCache: any = {};
      sortedUrls.forEach((u) => {
        newCache[u] = cache[u];
      });
      await chrome.storage.local.set({ analysisCache: newCache });
    } else {
      await chrome.storage.local.set({ analysisCache: cache });
    }
  } catch (error) {
    console.error('Error caching analysis:', error);
  }
}

/**
 * Update extension icon based on risk score
 */
async function updateExtensionIcon(
  riskScore: number,
  tabId?: number
): Promise<void> {
  try {
    const iconPath = riskScore >= 0.7 ? ICON_PATHS.danger : ICON_PATHS.safe;

    if (tabId) {
      await chrome.action.setIcon({ path: iconPath, tabId });
    } else {
      await chrome.action.setIcon({ path: iconPath });
    }

    // Update badge
    if (riskScore >= 0.7) {
      await chrome.action.setBadgeText({ text: '!', tabId });
      await chrome.action.setBadgeBackgroundColor({
        color: '#dc2626',
        tabId,
      });
    } else if (riskScore >= 0.3) {
      await chrome.action.setBadgeText({ text: '?', tabId });
      await chrome.action.setBadgeBackgroundColor({
        color: '#f59e0b',
        tabId,
      });
    } else {
      await chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (error) {
    console.error('Error updating icon:', error);
  }
}

/**
 * Notify content script of dangerous site
 */
async function notifyContentScript(
  analysis: AnalysisResponse,
  tabId?: number
): Promise<void> {
  if (analysis.riskScore >= 0.7 && tabId) {
    try {
      // Get settings to check if auto-block is enabled
      const result = await chrome.storage.sync.get('settings');
      const settings: SettingsResponse = result.settings || {
        autoBlock: true,
        notifications: true,
        whitelistedDomains: [],
      };

      if (settings.autoBlock) {
        await chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_WARNING',
          analysis,
        });
      }
    } catch (error) {
      console.error('Error notifying content script:', error);
    }
  }
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  switch (message.type) {
    case 'GET_CURRENT_ANALYSIS':
      handleGetCurrentAnalysis(sendResponse);
      return true; // Keep channel open for async response

    case 'GET_STATS':
      handleGetStats(sendResponse);
      return true;

    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.settings, sendResponse);
      return true;

    case 'ANALYZE_URL':
      handleAnalyzeURL(message.url, sendResponse);
      return true;

    case 'USER_CONTINUED':
      handleUserContinued(message.analysis);
      return false;

    case 'USER_WENT_BACK':
      handleUserWentBack(sender.tab?.id);
      return false;

    default:
      console.warn('Unknown message type:', message.type);
      return false;
  }
});

/**
 * Get current page analysis
 */
async function handleGetCurrentAnalysis(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get('currentAnalysis');
    sendResponse({ success: true, data: result.currentAnalysis || null });
  } catch (error) {
    console.error('Error getting current analysis:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Get stats
 */
async function handleGetStats(sendResponse: (response: any) => void) {
  try {
    const stats = await getStats();
    sendResponse({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Get settings
 */
async function handleGetSettings(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.sync.get('settings');
    if (result.settings) {
      sendResponse({ success: true, data: result.settings });
    } else {
      // Fetch from API if not in storage
      const settings = await getSettings();
      await chrome.storage.sync.set({ settings });
      sendResponse({ success: true, data: settings });
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Update settings
 */
async function handleUpdateSettings(
  newSettings: any,
  sendResponse: (response: any) => void
) {
  try {
    const updated = await updateSettings(newSettings);
    await chrome.storage.sync.set({ settings: updated });
    sendResponse({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating settings:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Analyze specific URL (from popup)
 */
async function handleAnalyzeURL(url: string, sendResponse: (response: any) => void) {
  try {
    const analysis = await analyzeAndStoreURL(url);
    sendResponse({ success: true, data: analysis });
  } catch (error) {
    console.error('Error analyzing URL:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Log when user continues to dangerous site
 */
function handleUserContinued(analysis: AnalysisResponse) {
  console.log('User continued to dangerous site:', analysis.url);
  // Could send telemetry here
}

/**
 * Handle when user goes back from dangerous site
 */
function handleUserWentBack(tabId?: number) {
  console.log('User went back from dangerous site');
  if (tabId) {
    chrome.tabs.goBack(tabId);
  }
}

export {};
