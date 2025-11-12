/**
 * Content Script
 * Injects warning overlays on dangerous sites
 */

import type { AnalysisResponse } from './types/api';
import './styles/warning-overlay.css';

console.log('PufferPhish content script loaded');

let warningOverlay: HTMLElement | null = null;

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_WARNING' && message.analysis) {
    showWarningOverlay(message.analysis);
    sendResponse({ success: true });
  }
  return false;
});

/**
 * Show full-page warning overlay
 */
function showWarningOverlay(analysis: AnalysisResponse): void {
  // Remove existing overlay if any
  if (warningOverlay) {
    warningOverlay.remove();
  }

  // Create overlay
  warningOverlay = document.createElement('div');
  warningOverlay.className = 'pufferphish-warning-overlay';
  warningOverlay.setAttribute('role', 'dialog');
  warningOverlay.setAttribute('aria-modal', 'true');
  warningOverlay.setAttribute('aria-labelledby', 'pufferphish-warning-title');
  warningOverlay.setAttribute('tabindex', '-1');

  // Get threat percentages
  const phishingPercent = Math.round(analysis.threats.phishing * 100);
  const malwarePercent = Math.round(analysis.threats.malware * 100);
  const socialPercent = Math.round(analysis.threats.social * 100);
  const riskPercent = Math.round(analysis.riskScore * 100);

  // Build overlay HTML
  warningOverlay.innerHTML = `
    <div class="pufferphish-warning-container">
      <div class="pufferphish-warning-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h1 id="pufferphish-warning-title" class="pufferphish-warning-title">
        ⚠️ Danger Ahead
      </h1>

      <p class="pufferphish-warning-message">
        This site has been identified as potentially dangerous. We've blocked access to protect you.
      </p>

      <div class="pufferphish-warning-details">
        <div class="pufferphish-risk-score">
          Risk Score: ${riskPercent}%
        </div>

        <div class="pufferphish-risk-meter">
          <div class="pufferphish-risk-fill" style="width: ${riskPercent}%"></div>
        </div>

        <div class="pufferphish-threats">
          <div class="pufferphish-threat-item">
            <input
              type="checkbox"
              class="pufferphish-threat-checkbox"
              ${phishingPercent >= 70 ? 'checked' : ''}
              disabled
              aria-label="Phishing threat detected"
            />
            <span>Phishing: ${phishingPercent}%</span>
          </div>
          <div class="pufferphish-threat-item">
            <input
              type="checkbox"
              class="pufferphish-threat-checkbox"
              ${malwarePercent >= 70 ? 'checked' : ''}
              disabled
              aria-label="Malware threat detected"
            />
            <span>Malware: ${malwarePercent}%</span>
          </div>
          <div class="pufferphish-threat-item">
            <input
              type="checkbox"
              class="pufferphish-threat-checkbox"
              ${socialPercent >= 70 ? 'checked' : ''}
              disabled
              aria-label="Social engineering threat detected"
            />
            <span>Social Engineering: ${socialPercent}%</span>
          </div>
        </div>
      </div>

      <div class="pufferphish-warning-actions">
        <button
          id="pufferphish-go-back"
          class="pufferphish-btn pufferphish-btn-primary"
          aria-label="Go back to safety"
        >
          ← Go Back to Safety
        </button>
        <button
          id="pufferphish-continue"
          class="pufferphish-btn pufferphish-btn-secondary"
          aria-label="Continue to this site anyway (not recommended)"
        >
          Continue Anyway (Not Recommended)
        </button>
      </div>

      <div class="pufferphish-branding">
        <span>Protected by</span>
        <strong>PufferPhish</strong>
      </div>
    </div>
  `;

  // Attach event listeners
  const goBackBtn = warningOverlay.querySelector('#pufferphish-go-back');
  const continueBtn = warningOverlay.querySelector('#pufferphish-continue');

  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => handleGoBack(analysis));
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => handleContinue(analysis));
  }

  // ESC key to go back
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleGoBack(analysis);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Inject into page
  document.body.appendChild(warningOverlay);

  // Focus overlay for accessibility
  warningOverlay.focus();

  // Prevent scrolling on body
  document.body.style.overflow = 'hidden';

  console.log('Warning overlay displayed for:', analysis.url);
}

/**
 * Handle "Go Back" action
 */
function handleGoBack(analysis: AnalysisResponse): void {
  console.log('User chose to go back from:', analysis.url);

  // Notify background script
  chrome.runtime.sendMessage({
    type: 'USER_WENT_BACK',
    analysis,
  });

  // Remove overlay
  if (warningOverlay) {
    warningOverlay.remove();
    warningOverlay = null;
  }

  // Restore scrolling
  document.body.style.overflow = '';

  // Go back in history
  window.history.back();
}

/**
 * Handle "Continue Anyway" action
 */
function handleContinue(analysis: AnalysisResponse): void {
  console.log('User chose to continue to dangerous site:', analysis.url);

  // Notify background script
  chrome.runtime.sendMessage({
    type: 'USER_CONTINUED',
    analysis,
  });

  // Remove overlay
  if (warningOverlay) {
    warningOverlay.remove();
    warningOverlay = null;
  }

  // Restore scrolling
  document.body.style.overflow = '';
}

export {};