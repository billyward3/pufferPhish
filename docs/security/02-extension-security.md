# Browser Extension Security Guidelines

## Content Security Policy

### Manifest V3 CSP Configuration

```json
{
  "manifest_version": 3,
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts; script-src 'self'"
  },
  "permissions": [
    "storage",       // Local data storage
    "tabs",          // Tab information access
    "activeTab",     // Active tab content
    "scripting"      // Content script injection
  ],
  "host_permissions": [
    "https://api.pufferphish.com/*"  // Only our API
  ]
}
```

**Key Security Principles:**
- No inline scripts allowed
- No `eval()` or similar dynamic code execution
- Only load resources from extension package
- Minimal permissions requested

## Secure API Communication

### Authentication Token Storage

```typescript
// Store auth token securely
async function storeAuthToken(token: string) {
  // Use local storage (encrypted by browser)
  await chrome.storage.local.set({
    authToken: token,
    tokenExpiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });

  // NEVER use:
  // - chrome.storage.sync (syncs across devices, less secure)
  // - localStorage in content scripts (accessible to page)
  // - Cookies (accessible to websites)
}

// Retrieve token securely
async function getAuthToken(): Promise<string | null> {
  const { authToken, tokenExpiry } = await chrome.storage.local.get([
    'authToken',
    'tokenExpiry'
  ]);

  // Check expiry
  if (!authToken || Date.now() > tokenExpiry) {
    return null;
  }

  return authToken;
}

// Clear on logout
async function clearAuthToken() {
  await chrome.storage.local.remove(['authToken', 'tokenExpiry']);
}
```

### HTTPS-Only Communication

```typescript
const API_URL = 'https://api.pufferphish.com';  // Always HTTPS

async function callAPI(endpoint: string, data: any) {
  // Validate URL is HTTPS
  if (!API_URL.startsWith('https://')) {
    throw new Error('API must use HTTPS');
  }

  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

### Certificate Pinning (Optional Enhanced Security)

```typescript
// Verify API certificate
async function verifyCertificate(url: string) {
  const response = await fetch(url, { method: 'HEAD' });

  // In production, could verify specific certificate fingerprints
  // For now, browser's built-in HTTPS validation is sufficient

  if (!response.url.startsWith('https://')) {
    throw new Error('Connection not secure');
  }
}
```

## Input Validation & Sanitization

### URL Validation

```typescript
function isValidUrl(url: string): boolean {
  // Length check
  if (!url || url.length > 2048 || url.length < 10) {
    return false;
  }

  // Protocol check
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '10.',      // Private network
      '172.16.',  // Private network
      '192.168.', // Private network
      '[::1]',    // IPv6 localhost
      'file://'   // Local files
    ];

    if (blockedPatterns.some(pattern => hostname.includes(pattern))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Use before sending to API
async function analyzeUrl(url: string) {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }

  return await callAPI('/analyze', { url });
}
```

### XSS Prevention

```typescript
// Sanitize before injecting into DOM
function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;  // Treats as text, not HTML
  return div.innerHTML;
}

// Safe DOM injection
function showWarning(message: string, url: string) {
  const warningDiv = document.createElement('div');
  warningDiv.id = 'pufferphish-warning';

  // Use textContent, not innerHTML
  const messageEl = document.createElement('p');
  messageEl.textContent = message;  // Safe: no HTML parsing

  const urlEl = document.createElement('code');
  urlEl.textContent = url;  // Safe: no HTML parsing

  warningDiv.appendChild(messageEl);
  warningDiv.appendChild(urlEl);

  document.body.appendChild(warningDiv);
}

// NEVER do this:
// element.innerHTML = userInput;  // XSS vulnerability!
// element.innerHTML = `<p>${message}</p>`;  // Still vulnerable!
```

### Message Passing Security

```typescript
// Service worker (background.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender
  if (!sender.id || sender.id !== chrome.runtime.id) {
    console.error('Message from unknown sender');
    return false;
  }

  // Validate message structure
  if (!message || typeof message.type !== 'string') {
    console.error('Invalid message format');
    return false;
  }

  // Handle specific message types
  switch (message.type) {
    case 'ANALYZE_URL':
      handleAnalyzeUrl(message.url)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;  // Keep channel open for async response

    case 'GET_STATS':
      handleGetStats()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    default:
      console.error('Unknown message type:', message.type);
      return false;
  }
});

// Content script sends messages
async function requestAnalysis(url: string) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'ANALYZE_URL',
        url: url
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      }
    );
  });
}
```

## Content Script Security

### Isolated World Execution

```typescript
// Content scripts run in isolated world
// Page scripts CANNOT access extension APIs or variables

// Safe: Extension variables not accessible to page
let authToken = 'secret-token';

// Safe: Page cannot call this
function getToken() {
  return authToken;
}

// Communicate with page only via postMessage
window.addEventListener('message', (event) => {
  // ALWAYS verify origin
  if (event.origin !== window.location.origin) {
    return;
  }

  // Validate message
  if (event.data.type === 'PAGE_REQUEST') {
    // Handle safely
    handlePageRequest(event.data);
  }
});
```

### Safe DOM Manipulation

```typescript
// Inject warning safely
function injectWarningOverlay(data: AnalysisResult) {
  // Create shadow DOM for style isolation
  const container = document.createElement('div');
  container.id = 'pufferphish-root';

  const shadow = container.attachShadow({ mode: 'closed' });

  // Load styles safely
  const style = document.createElement('style');
  style.textContent = SAFE_WARNING_STYLES;  // From extension bundle
  shadow.appendChild(style);

  // Create warning elements
  const warning = document.createElement('div');
  warning.className = 'warning-container';

  // Use textContent for all user data
  const title = document.createElement('h2');
  title.textContent = 'Warning: Potential Threat Detected';

  const description = document.createElement('p');
  description.textContent = data.explanation;  // Safe: no HTML parsing

  warning.appendChild(title);
  warning.appendChild(description);

  shadow.appendChild(warning);
  document.body.appendChild(container);
}

// Clean up when done
function removeWarningOverlay() {
  const container = document.getElementById('pufferphish-root');
  container?.remove();
}
```

## Data Privacy

### What to Store Locally

**Safe to Store:**
```typescript
interface SafeLocalData {
  authToken: string;           // Encrypted by browser
  tokenExpiry: number;
  settings: {
    autoBlock: boolean;
    notifications: boolean;
  };
  whitelistedDomains: string[]; // User's trusted domains
  lastSyncTime: number;
}
```

**Never Store:**
- User passwords (even hashed)
- Credit card or payment info
- Full page content
- Personal messages or emails
- Other users' data

### Clear Data on Uninstall

```typescript
// Listen for uninstall event
chrome.runtime.setUninstallURL('https://pufferphish.com/goodbye', () => {
  // Clear all extension data
  chrome.storage.local.clear();
  chrome.storage.sync.clear();

  // Revoke authentication
  fetch(`${API_URL}/auth/revoke`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).catch(console.error);
});
```

## Permissions Security

### Minimal Permissions

```json
{
  "permissions": [
    "storage",      // Required: Store auth token and settings
    "activeTab"     // Required: Analyze current tab URL
  ],
  "optional_permissions": [
    "tabs",         // Optional: Full tab access for history
    "notifications" // Optional: Show threat notifications
  ],
  "host_permissions": [
    "https://api.pufferphish.com/*"  // Only our API, no wildcards
  ]
}
```

### Request Permissions Dynamically

```typescript
// Request optional permissions only when needed
async function enableNotifications() {
  const granted = await chrome.permissions.request({
    permissions: ['notifications']
  });

  if (granted) {
    await chrome.storage.local.set({ notificationsEnabled: true });
    return true;
  }

  return false;
}

// Check before using
async function showNotification(title: string, message: string) {
  const hasPermission = await chrome.permissions.contains({
    permissions: ['notifications']
  });

  if (!hasPermission) {
    console.log('Notifications not enabled');
    return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: sanitizeHTML(title),
    message: sanitizeHTML(message)
  });
}
```

## Update Security

### Automatic Updates

```json
{
  "update_url": "https://clients2.google.com/service/update2/crx"
}
```

- Chrome Web Store handles secure updates
- Users get updates automatically
- No need for in-extension update mechanism

### Version Validation

```typescript
// Check for minimum required API version
const MIN_API_VERSION = '1.0.0';

async function checkApiCompatibility() {
  const response = await fetch(`${API_URL}/version`);
  const { version } = await response.json();

  if (compareVersions(version, MIN_API_VERSION) < 0) {
    throw new Error('API version too old. Please update the extension.');
  }
}
```

## Error Handling

### Safe Error Messages

```typescript
// Log errors without exposing sensitive data
function logError(error: Error, context: string) {
  // DO NOT include:
  // - Auth tokens
  // - Full URLs (may contain credentials)
  // - User IDs
  // - API responses with personal data

  console.error('PufferPhish Error', {
    context: context,
    message: error.message,
    // Do not include: error.stack (may contain sensitive paths)
    timestamp: new Date().toISOString()
  });

  // Send to API for monitoring (sanitized)
  fetch(`${API_URL}/errors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      context: context,
      message: error.message,
      extensionVersion: chrome.runtime.getManifest().version
    })
  }).catch(() => {
    // Silently fail if error reporting fails
  });
}

// Usage
try {
  await analyzeUrl(url);
} catch (error) {
  logError(error, 'analyze_url');
  // Show user-friendly message (no technical details)
  showUserNotification('Unable to analyze URL', 'Please try again later.');
}
```

## Web Store Security

### Privacy Policy

Required by Chrome Web Store:

```markdown
# PufferPhish Privacy Policy

## Data Collection
We collect:
- URLs you analyze (for threat detection)
- Basic usage statistics (threats blocked, scans performed)
- Account email (for authentication)

We DO NOT collect:
- Browsing history (except URLs you explicitly check)
- Page content or personal messages
- Passwords or payment information
- Data from other extensions

## Data Usage
- URLs analyzed to detect phishing threats
- Statistics aggregated for service improvement
- No data sold to third parties

## Data Storage
- Stored securely on AWS
- Encrypted in transit and at rest
- Retained for 90 days, then deleted

## Your Rights
- View your data in the dashboard
- Delete your account and all data
- Opt out of notifications
```

### Code Obfuscation Prevention

```typescript
// DO NOT minify/obfuscate for Web Store submission
// Chrome Web Store requires readable code for review

// Use source maps for production debugging
// But do not include them in submitted package
```

## Security Checklist

### Pre-Submission to Chrome Web Store
- [ ] CSP properly configured
- [ ] Minimal permissions requested
- [ ] No inline scripts
- [ ] HTTPS-only API communication
- [ ] Auth tokens stored securely
- [ ] Input validation on all user inputs
- [ ] XSS prevention implemented
- [ ] Privacy policy published
- [ ] No obfuscated code
- [ ] Source code readable

### Runtime Security
- [ ] API responses validated
- [ ] Error messages don't leak data
- [ ] Tokens expire and refresh
- [ ] Warning overlays use shadow DOM
- [ ] Message passing validates senders
- [ ] No eval() or Function() usage

### User Privacy
- [ ] Clear data on uninstall
- [ ] User can export their data
- [ ] User can delete their account
- [ ] No tracking without consent
- [ ] Transparent about data collection

## Incident Response

### Extension Compromised

If extension account compromised:
1. **Immediately**: Revoke Chrome Web Store access
2. **Notify**: All users via dashboard
3. **Revoke**: All issued auth tokens
4. **Investigate**: Review access logs
5. **Patch**: Fix vulnerability
6. **Resubmit**: New version to Web Store

### API Key Leaked

If API credentials leaked:
1. **Rotate**: Generate new API keys
2. **Update**: Extension with new credentials
3. **Revoke**: Old credentials
4. **Monitor**: For unauthorized usage
5. **Notify**: Users to update extension

### User Token Compromised

If user reports stolen token:
1. **Revoke**: User's current token
2. **Force**: Re-authentication
3. **Check**: Recent activity for suspicious actions
4. **Notify**: User of any suspicious activity
5. **Log**: Incident for audit

## Resources

- [Chrome Extension Security Best Practices](https://developer.chrome.com/docs/extensions/mv3/security/)
- [Content Security Policy](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
- [Secure Coding Practices](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_Practices_Cheat_Sheet.html)
