# PufferPhish Extension Testing Guide

## Quick Start Testing

### 1. Build the Extension

```bash
cd /Users/billyward/Documents/pufferPhish/packages/extension
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 2. Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder: `/Users/billyward/Documents/pufferPhish/packages/extension/dist`
5. Extension should now appear with the PufferPhish logo

### 3. Test Basic Functionality

#### A. Test Safe Site (Whitelisted)
1. Navigate to `https://google.com`
2. Extension icon should stay normal (blue pufferfish)
3. Click extension icon to open popup
4. Should show "Safe" state with low risk score

#### B. Test Suspicious Site (Demo Mode)
Since we're in development, you can test with mock data:

1. Create a test HTML file to simulate a suspicious site:

```bash
cat > /tmp/test-phishing.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Phishing Site</title>
</head>
<body>
    <h1>This is a test page for phishing detection</h1>
    <p>URL: suspicious-phishing-test.example.com</p>
</body>
</html>
EOF
```

2. Open the file: `file:///tmp/test-phishing.html`
3. Extension will analyze it (may show as safe since it's localhost)

#### C. Test with Real URLs (Requires API)

**Option 1: Demo Mode (No API needed)**
- Extension uses mock data automatically if API is unreachable
- All functionality works with simulated responses

**Option 2: Live API Mode**
1. Ensure API server is running:
   ```bash
   cd /Users/billyward/Documents/pufferPhish/packages/api
   npm run dev
   ```
2. Server should be at `http://localhost:3001`
3. Extension will make real API calls

### 4. Test Features

#### Icon States
- **Green/Normal**: Safe sites (risk < 0.3)
- **Yellow Badge (?)**: Warning sites (risk 0.3-0.69)
- **Red Icon + Badge (!)**: Dangerous sites (risk >= 0.7)

#### Popup Views
- **Safe View**: Green checkmark, low risk score
- **Warning View**: Yellow alert, medium risk score
- **Danger View**: Red alert, high risk score, blocked message

#### Warning Overlay
To test the warning overlay (appears on dangerous sites):

1. Navigate to a URL with "phish" or "malicious" in the name (in demo mode)
2. Or modify background script to lower the threshold temporarily
3. Full-page red warning should appear
4. Test "Go Back to Safety" button
5. Test "Continue Anyway" button
6. Test ESC key (should go back)

### 5. Debug Console

Open Chrome DevTools to see logs:

**Background Script Logs:**
1. Go to `chrome://extensions/`
2. Find PufferPhish extension
3. Click "service worker" link
4. Opens DevTools for background script

**Content Script Logs:**
1. Navigate to any page
2. Open DevTools (F12)
3. Check Console tab
4. Should see "PufferPhish content script loaded"

**Popup Logs:**
1. Right-click extension icon → Inspect popup
2. Opens DevTools for popup
3. Check Console for popup logs

### 6. Test Settings

1. Click extension icon
2. Click "Settings" button (if integrated)
3. Toggle auto-block on/off
4. Add domains to whitelist
5. Check that settings persist (stored in chrome.storage.sync)

### 7. Test Stats

1. Click extension icon
2. Check stats display:
   - Total scans
   - Threats blocked
   - Average risk score
   - Recent analyses list

---

## Demo Mode vs Live Mode

### Demo Mode (Default)
- No API server needed
- Uses mock data from `src/utils/mock-data.ts`
- Simulated 500ms network delay
- Deterministic behavior

**Enable Demo Mode:**
```bash
# In packages/extension/.env
VITE_DEMO_MODE=true
npm run build
```

### Live Mode
- Requires API server at localhost:3001
- Real phishing analysis
- Database persistence
- Actual ML responses

**Enable Live Mode:**
```bash
# In packages/extension/.env
VITE_DEMO_MODE=false
npm run build
```

---

## Known Test Scenarios

### Mock Data URLs (Demo Mode)

**Safe URLs** (risk ~ 0.05):
- https://google.com
- https://github.com
- https://stackoverflow.com
- https://mozilla.org
- https://wikipedia.org

**Dangerous URLs** (risk ~ 0.92):
- Anything with "phish" in URL
- Anything with "malicious" in URL
- Anything with "scam" in URL

**Warning URLs** (risk ~ 0.55):
- Any other URL not whitelisted

### Testing Checklist

- [ ] Extension loads without errors
- [ ] Icon appears in Chrome toolbar
- [ ] Popup opens when clicking icon
- [ ] Safe sites show green checkmark
- [ ] Dangerous sites show red warning
- [ ] Warning overlay appears for high-risk sites
- [ ] "Go Back" button works
- [ ] "Continue Anyway" removes overlay
- [ ] Extension icon changes based on risk
- [ ] Badge appears for warnings/dangers
- [ ] Settings can be updated
- [ ] Stats display correctly
- [ ] Cache works (same URL analyzed quickly)
- [ ] No console errors in background/content/popup

---

## Troubleshooting

### Extension won't load
- Check that you built first: `npm run build`
- Check `dist/` folder exists and has files
- Check manifest.json is in `dist/`
- Look for errors in `chrome://extensions/`

### API calls failing
- Check API server is running: `http://localhost:3001/health`
- Check manifest.json has `http://localhost:3001/*` in host_permissions
- Check browser console for CORS errors
- Try demo mode if API isn't needed

### Warning overlay not showing
- Check background script console for errors
- Check risk score is >= 0.7
- Check autoBlock setting is enabled
- Check content script loaded (check page console)

### Icons not appearing
- Check `dist/images/` folder has all PNG files
- Check manifest.json icon paths are correct
- Try reloading extension

### Build errors
- Run `npm install` in extension folder
- Check TypeScript errors: `npm run build`
- Check webpack config is correct

---

## Advanced Testing

### Test API Integration

```bash
# Start API server
cd /Users/billyward/Documents/pufferPhish/packages/api
npm run dev

# Test endpoints manually
curl http://localhost:3001/health
curl -X POST http://localhost:3001/analyze -H "Content-Type: application/json" -d '{"url":"https://google.com"}'
curl http://localhost:3001/stats
curl http://localhost:3001/settings
```

### Test Chrome Storage

```javascript
// In background script console or popup console:
chrome.storage.local.get(null, (data) => console.log('Local storage:', data));
chrome.storage.sync.get(null, (data) => console.log('Sync storage:', data));
```

### Test Message Passing

```javascript
// In popup console:
chrome.runtime.sendMessage({type: 'GET_CURRENT_ANALYSIS'}, (response) => {
  console.log('Current analysis:', response);
});

chrome.runtime.sendMessage({type: 'GET_STATS'}, (response) => {
  console.log('Stats:', response);
});
```

### Performance Testing

```javascript
// In background script console:
console.time('analyze');
// Navigate to a URL
// Check how long analysis takes
console.timeEnd('analyze');
```

---

## Demo Script for Presentation

1. **Show extension installed**
   - `chrome://extensions/` page
   - PufferPhish extension visible and enabled

2. **Visit safe site**
   - Navigate to github.com
   - Show icon stays normal
   - Open popup → shows safe status
   - Show low risk score

3. **Show stats**
   - Click extension icon
   - Display total scans and stats
   - Show recent analyses

4. **Demonstrate settings**
   - Open settings view
   - Toggle auto-block
   - Add domain to whitelist
   - Show persistence

5. **Dangerous site warning**
   - Navigate to test URL with "phish" in name
   - Full-page warning appears
   - Demonstrate "Go Back" button
   - Show overlay design and threat details

6. **Background/architecture**
   - Show background script console
   - Show analysis logs
   - Explain icon badge updates
   - Show cache in action (visit same URL twice)

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Adjust UI based on feedback**
3. **Add any missing features**
4. **Optimize performance**
5. **Prepare for Chrome Web Store**
6. **Create user documentation**
