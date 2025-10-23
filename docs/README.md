# PufferPhish Lofi Prototype

**Version:** 1.0
**Purpose:** User testing with non-technical audiences
**Date:** October 2025

## 📋 Overview

This is a fully interactive HTML/CSS/JavaScript prototype of the PufferPhish phishing detection system. It demonstrates three key interfaces:

1. **Browser Extension Popup** - Main user interface (320×600px)
2. **Web Dashboard** - Full analytics and settings interface
3. **In-Page Warnings** - Real-time alerts on suspicious websites

The prototype is built for user testing with seniors, non-English speakers, and small business owners. All interactions are functional with realistic demo data.

---

## 🚀 Quick Start

### Option 1: Open Locally (30 seconds)

The fastest way to view the prototype:

```bash
# Navigate to prototype folder
cd /Users/billyward/Documents/pufferPhish/prototype

# Open in your default browser
open index.html

# OR double-click index.html in Finder
```

**Pros:** Instant, no setup
**Cons:** Can't share with remote participants

---

### Option 2: Local Development Server (1 minute)

Better for testing and development:

#### Using Python (pre-installed on macOS):
```bash
cd /Users/billyward/Documents/pufferPhish/prototype
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

#### Using Node.js:
```bash
cd /Users/billyward/Documents/pufferPhish/prototype
npx serve .
```

#### Using VS Code:
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

**Pros:** Professional URL, simulates web behavior
**Cons:** Still local only

---

### Option 3: GitHub Pages (Recommended - 5 minutes)

**Best for user testing and sharing**

#### Step 1: Push to GitHub

```bash
# From project root
cd /Users/billyward/Documents/pufferPhish

# Create a dedicated branch (optional but recommended)
git checkout -b prototype/lofi-v1

# Add and commit the prototype files
git add prototype/
git commit -m "Add lofi HTML prototype for user testing"

# Push to GitHub
git push origin prototype/lofi-v1

# OR push to main branch
git push origin main
```

#### Step 2: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/yourteam/pufferphish`
2. Click **Settings** (top navigation)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**:
   - Select branch: `main` or `prototype/lofi-v1`
   - Select folder: `/prototype`
   - Click **Save**
5. Wait 2-3 minutes for deployment

#### Step 3: Access Your Prototype

Your prototype will be available at:

```
https://yourteam.github.io/pufferphish/prototype/
```

**Share this link with:**
- User testing participants
- Team members
- Instructors
- Stakeholders

#### Step 4: Making Updates

```bash
# Make changes to HTML/CSS/JS files
# Then:
git add prototype/
git commit -m "Update prototype based on feedback"
git push

# Changes go live in 1-2 minutes automatically!
```

**Pros:**
✅ Shareable link for anyone, anywhere
✅ Works on all devices (desktop, tablet, phone)
✅ Free hosting
✅ Auto-updates when you push changes
✅ Professional presentation

**Cons:**
❌ 2-3 minute deploy time (first time only)

---

## 🎯 Using the Prototype

### Landing Page (`index.html`)

- Overview of all three interfaces
- Click any card to explore that interface
- Mobile-responsive

### Extension Popup (`extension-popup.html`)

**Three states to explore:**

1. **Safe State** (default)
   - Green shield, protected status
   - Today's protection stats
   - Clean, minimal interface

2. **Warning State**
   - Yellow warning, medium risk (58%)
   - Risk score meter
   - Threat checklist
   - Action buttons

3. **Danger State**
   - Red stop sign, high risk (92%)
   - Urgent warnings
   - Comparison of real vs fake site
   - Strong call-to-action

**Demo Controls:**
- Click buttons in bottom-right to switch states
- Press keyboard: `1` (safe), `2` (warning), `3` (danger)

### Dashboard (`dashboard.html`)

**Four tabs:**

1. **Overview**
   - Protection statistics (4 large stat cards)
   - Bar chart showing daily activity
   - Recent activity timeline

2. **History**
   - Filterable protection history
   - Search by site
   - Filter by date/risk level
   - Detailed event cards

3. **Settings**
   - Protection level slider
   - Toggle switches for notifications
   - Whitelist management
   - Account settings

4. **Help**
   - Placeholder for help resources

**Navigation:**
- Click tabs to switch views
- Keyboard shortcuts: `Alt+1/2/3/4`

### Warning Demos (`warning-demos.html`)

**Four warning types:**

1. **Medium Risk Banner**
   - Yellow banner at top of page
   - Non-intrusive, dismissible
   - "Show Details" expands to full panel

2. **High Risk Banner**
   - Red banner at top of page
   - More urgent messaging
   - Links to full interstitial

3. **Expanded Panel**
   - Detailed threat information
   - Why flagged, what to do
   - Action buttons (Leave/Trust)

4. **Full Page Interstitial**
   - Blocks entire page
   - Strong warning language
   - Must actively choose to proceed

**Demo Controls:**
- Click buttons at top to show different warnings
- "Reset View" clears all warnings
- Press `Escape` to dismiss any warning

---

## 📱 Device Testing

The prototype is fully responsive and works on:

- **Desktop:** 1024px and above (optimal experience)
- **Tablet:** 768px - 1023px (adapted layouts)
- **Mobile:** 320px - 767px (single column, touch-optimized)

**Test on real devices:**
- Deploy to GitHub Pages
- Open link on phone/tablet
- Actual device testing is crucial for accessibility

---

## ♿ Accessibility Features

The prototype includes:

- **Keyboard Navigation:** Full Tab/Enter/Arrow support
- **Screen Reader:** ARIA labels and live regions
- **Focus Indicators:** 2px outlines on all interactive elements
- **High Contrast:** 7:1 text contrast ratio
- **Touch Targets:** Minimum 44×44px
- **Skip Links:** "Skip to main content" on each page
- **Reduced Motion:** Respects `prefers-reduced-motion`

**Test with:**
- VoiceOver (Mac): `Cmd+F5` to enable
- NVDA (Windows): Free screen reader
- Keyboard only: Unplug mouse, navigate with Tab

---

## 🧪 User Testing Guide

### Session Setup (In-Person)

```bash
# Start local server
cd /Users/billyward/Documents/pufferPhish/prototype
python3 -m http.server 8000

# Open on your device:
http://localhost:8000

# Hand device to participant
```

### Session Setup (Remote)

1. Deploy to GitHub Pages (see above)
2. Send participant the link via email:
   ```
   Subject: PufferPhish User Testing - Your Link

   Hi [Name],

   Thank you for participating in our user testing session!

   Please open this link: https://yourteam.github.io/pufferphish/prototype/

   You can access it anytime before our session on [date].

   Let me know if you have any issues accessing it.

   Best,
   [Your Name]
   ```
3. Conduct session via Zoom/Meet

### Testing Tasks

See `TESTING-GUIDE.md` for complete session structure including:
- Task scenarios
- Observation checklist
- Success metrics
- Interview questions

---

## 📂 File Structure

```
prototype/
├── index.html                  # Landing page
├── extension-popup.html        # Extension popup (3 states)
├── dashboard.html             # Web dashboard (4 tabs)
├── warning-demos.html         # In-page warnings (4 types)
├── assets/
│   ├── css/
│   │   ├── main.css          # Design system & base styles
│   │   ├── components.css    # Reusable UI components
│   │   └── animations.css    # (not yet added)
│   ├── js/
│   │   └── (future: demo-data.js)
│   └── images/
│       └── (icons if needed)
├── README.md                   # This file
└── TESTING-GUIDE.md           # User testing instructions
```

---

## 🎨 Design System

### Colors (Grayscale for Lofi)

```css
--color-gray-50:  #F9FAFB  /* Backgrounds */
--color-gray-200: #E5E7EB  /* Borders */
--color-gray-600: #4B5563  /* Secondary text */
--color-gray-900: #111827  /* Primary text */

/* Semantic (visual indicators) */
--color-safe:    #10B981  /* Green */
--color-warning: #F59E0B  /* Yellow */
--color-danger:  #EF4444  /* Red */
```

### Typography

```css
Font Family: System fonts (-apple-system, etc.)

Sizes:
- 48px: Stat numbers, interstitial titles
- 32px: Page titles
- 24px: Section headers
- 20px: Card headers
- 16px: Body text (base)
- 14px: Secondary text
- 12px: Meta text, labels

Weights:
- 400: Regular
- 600: Semibold
- 700: Bold
```

### Spacing

```css
4px, 8px, 16px, 24px, 32px, 48px, 64px
(Follows 8px base grid)
```

---

## 🛠️ Customization

### Changing Demo Data

Edit HTML files directly to change:
- Statistics numbers
- Timeline events
- History entries
- Risk scores

**Example:** Change threat blocked count:
```html
<!-- In extension-popup.html -->
<span class="stat-number">12</span>  <!-- Change this -->
```

### Adding New Components

1. Add HTML structure to appropriate file
2. Add styles to `assets/css/components.css`
3. Add interactions with inline `<script>` or external JS

### Styling Changes

**Quick changes:** Edit inline `<style>` in each HTML file

**Global changes:** Edit `assets/css/main.css` (affects all pages)

---

## 🐛 Troubleshooting

### GitHub Pages not working

**Problem:** 404 error or site not loading

**Solutions:**
1. Check Settings → Pages shows "Your site is published"
2. Verify branch/folder are correct
3. Wait 5 minutes (can take time on first deploy)
4. Check URL ends with `/prototype/` not `/prototype`
5. Try incognito mode (cache issue)

### Local server port in use

**Problem:** `Address already in use` error

**Solution:**
```bash
# Use a different port
python3 -m http.server 8001

# Or kill existing process
lsof -ti:8000 | xargs kill -9
```

### Styles not updating

**Problem:** Changes not showing after edit

**Solutions:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
2. Clear browser cache
3. Try incognito/private window
4. Check file saved correctly

### Mobile view looks broken

**Problem:** Layout issues on small screens

**Solution:**
- Ensure viewport meta tag exists (already included)
- Test with real device, not just browser resize
- Check media queries in CSS

---

## 📊 Collecting Feedback

### During Testing

1. **Screen Recording:**
   ```bash
   # Mac built-in
   Cmd+Shift+5 → Record screen

   # Or use Zoom's recording feature for remote sessions
   ```

2. **Note-Taking Template:**
   ```
   Participant: [ID/pseudonym]
   Date: [date]
   Persona: [senior/non-English/business owner]

   Task 1: [description]
   - Completed: Yes/No
   - Time: X minutes
   - Issues: [list]
   - Quotes: "[exact words]"

   Task 2: ...
   ```

3. **Post-Session:**
   - Export notes to `docs/user-testing/session-[N].md`
   - Synthesize findings after every 5 participants
   - Update prototype based on critical issues

---

## 🔄 Iteration Workflow

```bash
# 1. Conduct user testing (5 participants)
# 2. Synthesize findings

# 3. Make changes locally
# Edit HTML/CSS files

# 4. Test changes
python3 -m http.server 8000

# 5. Commit and push
git add prototype/
git commit -m "Fix: Make risk meter more visible based on user feedback"
git push

# 6. Changes live in 2 minutes
# 7. Repeat testing with new participants
```

---

## 📝 Next Steps

### After User Testing

1. **Synthesize Findings**
   - Create `docs/user-testing-results.md`
   - Document key insights per persona
   - Prioritize issues (critical → nice-to-have)

2. **Iterate Design**
   - Update wireframes based on feedback
   - Test critical changes with 3-5 new participants
   - Validate improvements

3. **Move to High-Fidelity**
   - Add color palette
   - Create design system in Figma
   - Polish visual design

4. **Developer Handoff**
   - Document component specifications
   - Create Storybook (optional)
   - Begin real implementation

---

## 📞 Support

### Technical Issues

- **Team Member:** [Assign tech lead]
- **Issues:** Create GitHub issue with label `prototype`

### Design Questions

- **Team Member:** [Assign design lead]
- **Reference:** See `docs/lofi-prototype-design.md`

---

## 🔗 Related Documents

- **Design Specifications:** `/docs/lofi-prototype-design.md`
- **Testing Guide:** `/prototype/TESTING-GUIDE.md` (coming next)
- **Architecture:** `/docs/architecture.md`
- **Original Concept:** `/docs/assignments/eecs497-concept-document.md`

---

## 📄 License

Private project for EECS 497 course. Not for distribution.

---

**Built with ❤️ by Team 49**
*Last updated: October 2025*
