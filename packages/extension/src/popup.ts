/**
 * PufferPhish Popup Script
 * Connects to background script to display real-time analysis data
 */

import './popup.css';
import './main.css';
import './components.css';
import type { AnalysisResponse, StatsResponse } from './types/api';

// UI State
let currentAnalysis: AnalysisResponse | null = null;
let currentStats: StatsResponse | null = null;

/**
 * Initialize popup when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadCurrentAnalysis();
  await loadStats();
});

/**
 * Load current page analysis from background script
 */
async function loadCurrentAnalysis(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_ANALYSIS' });

    if (response && response.success && response.data) {
      currentAnalysis = response.data;
      if (currentAnalysis) {
        updateAnalysisView(currentAnalysis);
      }
    } else {
      // No analysis available yet
      showView('safe'); // Default to safe view
      updateCurrentURL('No active analysis');
    }
  } catch (error) {
    console.error('Failed to load current analysis:', error);
    showView('safe');
    updateCurrentURL('Error loading analysis');
  }
}

/**
 * Load statistics from background script
 */
async function loadStats(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

    if (response && response.success && response.data) {
      currentStats = response.data;
      if (currentStats) {
        updateStatsDisplay(currentStats);
      }
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

/**
 * Update the view based on analysis risk score
 */
function updateAnalysisView(analysis: AnalysisResponse): void {
  const { riskScore, url, domain, threats } = analysis;

  // Determine which view to show
  let viewName: 'safe' | 'warning' | 'danger';
  if (riskScore >= 0.7) {
    viewName = 'danger';
  } else if (riskScore >= 0.3) {
    viewName = 'warning';
  } else {
    viewName = 'safe';
  }

  showView(viewName);
  updateCurrentURL(domain || url);
  updateRiskDetails(analysis);
}

/**
 * Update the current URL display
 */
function updateCurrentURL(urlText: string): void {
  const urlElements = document.querySelectorAll('.current-url');
  urlElements.forEach(element => {
    element.textContent = urlText;
  });
}

/**
 * Update risk score and threat details in all views
 */
function updateRiskDetails(analysis: AnalysisResponse): void {
  const { riskScore, threats } = analysis;
  const riskPercent = Math.round(riskScore * 100);
  const phishingPercent = Math.round(threats.phishing * 100);
  const malwarePercent = Math.round(threats.malware * 100);
  const socialPercent = Math.round(threats.social * 100);

  // Update risk score displays
  const riskScoreElements = document.querySelectorAll('.risk-score-value');
  riskScoreElements.forEach(element => {
    element.textContent = `${riskPercent}%`;
  });

  // Update risk meters
  const riskMeters = document.querySelectorAll('.risk-meter-fill');
  riskMeters.forEach(meter => {
    (meter as HTMLElement).style.width = `${riskPercent}%`;
  });

  // Update threat percentages
  updateThreatValue('phishing', phishingPercent);
  updateThreatValue('malware', malwarePercent);
  updateThreatValue('social', socialPercent);

  // Update confidence if available
  if (analysis.confidence !== undefined) {
    const confidencePercent = Math.round(analysis.confidence * 100);
    const confidenceElements = document.querySelectorAll('.confidence-value');
    confidenceElements.forEach(element => {
      element.textContent = `${confidencePercent}%`;
    });
  }
}

/**
 * Update individual threat percentage
 */
function updateThreatValue(threatType: string, percent: number): void {
  const elements = document.querySelectorAll(`.threat-${threatType}`);
  elements.forEach(element => {
    element.textContent = `${percent}%`;
  });
}

/**
 * Update statistics display
 */
function updateStatsDisplay(stats: StatsResponse): void {
  // Update total scans
  const totalScansElements = document.querySelectorAll('.total-scans');
  totalScansElements.forEach(element => {
    element.textContent = stats.totalScans.toString();
  });

  // Update threats blocked
  const threatsBlockedElements = document.querySelectorAll('.threats-blocked');
  threatsBlockedElements.forEach(element => {
    element.textContent = stats.threatsBlocked.toString();
  });

  // Update safe scans
  const safeScansElements = document.querySelectorAll('.safe-scans');
  safeScansElements.forEach(element => {
    element.textContent = stats.safeScans.toString();
  });

  // Update average risk score
  const avgRiskPercent = Math.round(stats.avgRiskScore * 100);
  const avgRiskElements = document.querySelectorAll('.avg-risk-score');
  avgRiskElements.forEach(element => {
    element.textContent = `${avgRiskPercent}%`;
  });
}

/**
 * Show a specific view and hide others
 */
function showView(viewName: 'safe' | 'warning' | 'danger'): void {
  // Hide all views
  document.querySelectorAll<HTMLElement>('.view').forEach(view => {
    view.classList.remove('active');
  });

  // Show selected view
  const viewToShow = document.getElementById(`${viewName}-view`);
  if (viewToShow) {
    viewToShow.classList.add('active');
  } else {
    console.error('View not found:', viewName);
    return;
  }

  // Announce to screen readers
  const stateText: Record<typeof viewName, string> = {
    'safe': 'Safe state: You are protected',
    'warning': 'Warning state: This page has suspicious signs',
    'danger': 'Danger state: This page is likely a scam'
  };

  announceToScreenReader(stateText[viewName]);
}

/**
 * Announce text to screen readers
 */
function announceToScreenReader(text: string): void {
  let announcement = document.getElementById('sr-announcement');
  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'sr-announcement';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    document.body.appendChild(announcement);
  }

  announcement.textContent = text;

  // Clear after delay
  setTimeout(() => {
    if (announcement) {
      announcement.textContent = '';
    }
  }, 1000);
}

/**
 * Set up all event listeners
 */
function setupEventListeners(): void {
  // Refresh button
  const refreshButton = document.getElementById('refresh-analysis');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      await refreshAnalysis();
    });
  }

  // Settings button (if exists in HTML)
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // Dashboard button - opens lofi prototype
  const dashboardButton = document.getElementById('dashboard-button');
  if (dashboardButton) {
    dashboardButton.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://billyward3.github.io/pufferPhish/dashboard.html' });
    });
  }

  // Demo controls (for testing)
  setupDemoControls();

  // Listen for background script updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYSIS_UPDATED') {
      currentAnalysis = message.analysis;
      if (currentAnalysis) {
        updateAnalysisView(currentAnalysis);
      }
      sendResponse({ success: true });
    }
    return false;
  });
}

/**
 * Set up demo controls for testing (optional)
 */
function setupDemoControls(): void {
  const demoSafe = document.getElementById('demo-safe');
  const demoWarning = document.getElementById('demo-warning');
  const demoDanger = document.getElementById('demo-danger');

  if (demoSafe) {
    demoSafe.addEventListener('click', () => showView('safe'));
  }

  if (demoWarning) {
    demoWarning.addEventListener('click', () => showView('warning'));
  }

  if (demoDanger) {
    demoDanger.addEventListener('click', () => showView('danger'));
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === '1') showView('safe');
    if (e.key === '2') showView('warning');
    if (e.key === '3') showView('danger');
    if (e.key === 'r' || e.key === 'R') refreshAnalysis();
  });
}

/**
 * Refresh the current page analysis
 */
async function refreshAnalysis(): Promise<void> {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      console.error('No active tab found');
      return;
    }

    // Request fresh analysis
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_URL',
      url: tab.url,
      force: true // Force refresh, ignore cache
    });

    if (response && response.analysis) {
      currentAnalysis = response.analysis;
      if (currentAnalysis) {
        updateAnalysisView(currentAnalysis);
        announceToScreenReader('Analysis refreshed');
      }
    }
  } catch (error) {
    console.error('Failed to refresh analysis:', error);
    announceToScreenReader('Failed to refresh analysis');
  }
}
