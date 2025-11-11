# Browser Extension Integration Guide

**Owner:** Extension Team Member
**Integration Partners:** Backend Team (API endpoints), ML Team (via API)

## Overview

The Chrome browser extension provides the user-facing interface for PufferPhish. It intercepts navigation, analyzes URLs via the backend API, and displays warnings when threats are detected.

## Core Responsibilities

### Extension Architecture
- Chrome Manifest V3 implementation
- Service worker (background script) for API communication
- Content scripts for page injection and warnings
- Popup UI for settings and statistics
- Local storage for auth tokens and preferences

### User Interaction
- Click-based URL scanning (manual check)
- Automatic scanning on navigation (configurable)
- Warning overlays (banner, panel, interstitial)
- User feedback submission
- Settings and whitelist management

### Chrome Web Store
- Extension packaging and submission
- Privacy policy and screenshots
- User onboarding flow
- Version updates

## Integration Interface

### Authentication Flow

**1. Initial Setup:**
```typescript
// User signs up via dashboard
// Extension receives auth token from dashboard

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTH_TOKEN') {
    chrome.storage.local.set({ authToken: message.token });
  }
});
```

**2. API Authentication:**
```typescript
// Include token in all API requests
async function callAPI(endpoint: string, data: any) {
  const { authToken } = await chrome.storage.local.get('authToken');

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

### URL Analysis Flow

**1. Extract URL:**
```typescript
// Service worker captures navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await analyzeUrl(changeInfo.url, tabId);
  }
});

// Or manual check via context menu
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'check-url') {
    analyzeUrl(info.linkUrl || info.pageUrl);
  }
});
```

**2. Send to Backend API:**
```typescript
async function analyzeUrl(url: string, tabId?: number) {
  try {
    const response = await callAPI('/analyze', {
      url: url,
      metadata: {
        referrer: document.referrer,
        userAction: 'click' // or 'navigation', 'manual'
      }
    });

    handleAnalysisResult(response, tabId);
  } catch (error) {
    handleError(error);
  }
}
```

**3. Expected API Response:**
```typescript
interface AnalysisResponse {
  analysisId: string;        // UUID for tracking
  url: string;
  domain: string;
  riskScore: number;         // 0.0 to 1.0
  threats: {
    phishing: number;
    malware: number;
    social: number;
  };
  blocked: boolean;          // Should we block this?
  source: string;            // "ml" | "rule" | "external_api"
  recommendation: string;    // "allow" | "warn" | "block"
  explanation: string;       // User-friendly message
}
```

### Warning Display

**Based on risk score, show appropriate warning:**

```typescript
function handleAnalysisResult(result: AnalysisResponse, tabId: number) {
  if (result.riskScore >= 0.8) {
    // HIGH RISK: Full-page interstitial block
    showInterstitialWarning(tabId, result);
  } else if (result.riskScore >= 0.5) {
    // MEDIUM RISK: Expanded panel warning
    showPanelWarning(tabId, result);
  } else if (result.riskScore >= 0.3) {
    // LOW RISK: Collapsed banner
    showBannerWarning(tabId, result);
  } else {
    // SAFE: Update icon, no warning
    updateExtensionIcon(tabId, 'safe');
  }
}
```

**Content Script Injection:**
```typescript
// Inject warning overlay into page
chrome.scripting.executeScript({
  target: { tabId: tabId },
  func: (warningData) => {
    // Create warning overlay
    const overlay = document.createElement('div');
    overlay.id = 'pufferphish-warning';
    overlay.innerHTML = `
      <div class="warning-header">
        <span class="icon">⚠️</span>
        <h3>WARNING: Potential Phishing Site</h3>
      </div>
      <p>${warningData.explanation}</p>
      <div class="warning-actions">
        <button id="go-back">Go Back (Safe)</button>
        <button id="continue-anyway">Continue Anyway</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },
  args: [result]
});
```

### User Feedback

**Allow users to report false positives/negatives:**
```typescript
async function submitFeedback(analysisId: string, correct: boolean, comment?: string) {
  await callAPI('/feedback', {
    analysisId: analysisId,
    correct: correct,
    actualThreat: correct ? null : 'none',
    comment: comment
  });
}
```

### Statistics Sync

**Fetch user statistics for popup:**
```typescript
async function getUserStats() {
  const stats = await callAPI('/stats', {});

  // Display in popup
  return {
    totalScans: stats.totalScans,
    threatsBlocked: stats.threatsBlocked,
    protectionRate: stats.protectionRate,
    recentThreats: stats.recentThreats.slice(0, 5)
  };
}
```

### Settings Management

**Sync settings with backend:**
```typescript
interface UserSettings {
  autoBlock: boolean;           // Automatically block high-risk sites
  notifications: boolean;       // Show notifications
  whitelistedDomains: string[]; // User's trusted domains
}

async function getSettings(): Promise<UserSettings> {
  return await callAPI('/settings', {});
}

async function updateSettings(settings: Partial<UserSettings>) {
  await callAPI('/settings', settings);

  // Update local cache
  chrome.storage.local.set({ settings });
}
```

## Extension Structure

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "PufferPhish Protection",
  "version": "1.0.0",
  "description": "Real-time phishing detection and protection",

  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "scripting",
    "contextMenus"
  ],

  "host_permissions": [
    "https://api.pufferphish.com/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["warning.css"],
      "run_at": "document_start"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### File Structure

```
packages/extension/
├── manifest.json
├── background.js          # Service worker (API calls, logic)
├── content.js            # Page injection, warnings
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── styles/
│   └── warning.css       # Warning overlay styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── utils/
    ├── api.js            # API communication
    └── storage.js        # Chrome storage wrapper
```

## API Endpoints Used

### POST /analyze
**Purpose:** Analyze URL for threats
**Request:**
```json
{
  "url": "https://example.com",
  "metadata": {
    "referrer": "https://google.com",
    "userAction": "click"
  }
}
```

**Response:** See AnalysisResponse interface above

### POST /feedback
**Purpose:** Submit user feedback
**Request:**
```json
{
  "analysisId": "uuid",
  "correct": false,
  "actualThreat": "none",
  "comment": "This is my company's website"
}
```

### GET /stats?timeRange=week
**Purpose:** Get user statistics
**Response:**
```json
{
  "totalScans": 147,
  "threatsBlocked": 12,
  "protectionRate": 0.97,
  "recentThreats": [...]
}
```

### GET /settings
**Purpose:** Get user preferences
**Response:**
```json
{
  "autoBlock": true,
  "notifications": true,
  "whitelistedDomains": ["example.com"]
}
```

### PUT /settings
**Purpose:** Update preferences
**Request:**
```json
{
  "autoBlock": false,
  "notifications": true
}
```

### POST /settings/whitelist
**Purpose:** Add domain to whitelist
**Request:**
```json
{
  "domain": "mycompany.com"
}
```

## Error Handling

### Network Errors
```typescript
async function analyzeUrl(url: string) {
  try {
    const result = await callAPI('/analyze', { url });
    return result;
  } catch (error) {
    // Offline or network error
    if (error.message === 'Failed to fetch') {
      return {
        riskScore: 0.5,
        recommendation: 'warn',
        explanation: 'Unable to verify site safety (offline)',
        offline: true
      };
    }
    throw error;
  }
}
```

### API Errors
```typescript
async function callAPI(endpoint: string, data: any) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    // ... headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, need to re-authenticate
      showAuthRequiredNotification();
      throw new Error('Authentication required');
    } else if (response.status === 429) {
      // Rate limited
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

### Invalid URLs
```typescript
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

## Security Considerations

### Content Security Policy
- No inline scripts in extension pages
- Only load resources from extension package
- Validate all API responses

### Secure Storage
```typescript
// Store sensitive data securely
await chrome.storage.local.set({
  authToken: token,  // Never in chrome.storage.sync
  settings: settings
});

// Clear on logout
await chrome.storage.local.clear();
```

### Input Sanitization
```typescript
// Sanitize before displaying user content
function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}
```

## User Experience

### Extension Icon States

```typescript
const iconStates = {
  safe: {
    icon: 'icons/safe.png',
    badge: { text: '✓', color: '#10B981' }
  },
  warning: {
    icon: 'icons/warning.png',
    badge: { text: '!', color: '#F59E0B' }
  },
  danger: {
    icon: 'icons/danger.png',
    badge: { text: '✗', color: '#EF4444' }
  },
  offline: {
    icon: 'icons/offline.png',
    badge: { text: '?', color: '#6B7280' }
  }
};

function updateExtensionIcon(tabId: number, state: string) {
  const stateConfig = iconStates[state];
  chrome.action.setIcon({
    path: stateConfig.icon,
    tabId: tabId
  });
  chrome.action.setBadgeText({
    text: stateConfig.badge.text,
    tabId: tabId
  });
  chrome.action.setBadgeBackgroundColor({
    color: stateConfig.badge.color,
    tabId: tabId
  });
}
```

### Popup UI Features

- **Today's Protection:** Scans and blocks today
- **Recent Threats:** Last 5 blocked sites
- **Quick Actions:** Check current page, open dashboard
- **Settings Toggle:** Enable/disable features
- **Whitelist Management:** Add current site to whitelist

### Notification System

```typescript
function showNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Example: Threat blocked
showNotification(
  'Threat Blocked',
  'PufferPhish blocked a phishing attempt on suspicious-site.com'
);
```

## Performance Optimization

### Caching
```typescript
// Cache analysis results locally (5 minutes)
const analysisCache = new Map<string, {result: any, timestamp: number}>();

async function analyzeUrl(url: string) {
  const cached = analysisCache.get(url);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.result;
  }

  const result = await callAPI('/analyze', { url });
  analysisCache.set(url, { result, timestamp: Date.now() });
  return result;
}
```

### Debouncing
```typescript
// Don't analyze every single navigation event
let analysisTimeout: number;

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    clearTimeout(analysisTimeout);
    analysisTimeout = setTimeout(() => {
      analyzeUrl(changeInfo.url, tabId);
    }, 500); // Wait 500ms for final URL
  }
});
```

## Testing

### Manual Testing Checklist
- [ ] Extension loads in Chrome without errors
- [ ] Icon shows correct states (safe/warning/danger)
- [ ] Popup displays statistics correctly
- [ ] Warnings display on dangerous sites
- [ ] User can dismiss or continue past warnings
- [ ] Feedback submission works
- [ ] Settings sync with backend
- [ ] Whitelist functionality works
- [ ] Works offline (graceful degradation)

### Integration Testing
- [ ] API authentication succeeds
- [ ] URL analysis returns expected format
- [ ] Statistics endpoint works
- [ ] Settings persist correctly
- [ ] Feedback reaches backend

## Deployment

### Chrome Web Store Submission

1. **Package extension:**
```bash
cd packages/extension
npm run build
# Creates extension.zip
```

2. **Prepare assets:**
- Screenshots (1280x800 or 640x400)
- Promo images (440x280 small, 920x680 large)
- Detailed description
- Privacy policy URL

3. **Submit to Chrome Web Store:**
- Upload extension.zip
- Complete store listing
- Submit for review
- Respond to feedback if needed

### Version Updates

```bash
# Update version in manifest.json
# Build and test
npm run build
npm run test

# Create new zip
npm run package

# Upload to Chrome Web Store developer dashboard
```

## Support & Communication

### Documentation Requirements
- README in `/packages/extension/` with build instructions
- User guide for extension features
- API integration documentation (keep updated)

### Integration Support
- Test against staging API before production
- Report API issues to backend team
- Coordinate on API contract changes

### Escalation
- API issues → Backend team
- Authentication problems → Backend team
- Performance concerns → Backend team for API optimization
