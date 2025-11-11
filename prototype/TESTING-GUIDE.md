# PufferPhish User Testing Guide

**Version:** 1.0
**Purpose:** Facilitate user testing sessions with lofi prototype
**Target Participants:** Seniors (65+), Non-English Speakers, Small Business Owners

---

## 📋 Overview

This guide provides everything you need to conduct effective user testing sessions with the PufferPhish lofi prototype. Each session should take approximately 30 minutes and focus on observing how participants understand and interact with the interfaces.

---

## 🎯 Testing Objectives

### Primary Goals

1. **Comprehension:** Do participants understand what PufferPhish does?
2. **Navigation:** Can they find and complete key tasks?
3. **Decision-Making:** Do warnings enable safe choices?
4. **Accessibility:** Are interfaces usable for non-technical users?

### Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Task completion rate | > 80% | Did they complete without help? |
| Time to complete | < 2 min per task | Start to completion time |
| Comprehension accuracy | > 90% | Do they understand actions? |
| Confidence rating | > 4/5 | Self-reported confidence |
| Error rate | < 10% | Wrong actions or confusion |
| Satisfaction | > 4/5 | Post-session rating |

---

## 👥 Participant Recruitment

### Target Distribution

| Persona | Count | Recruitment Sources |
|---------|-------|---------------------|
| Seniors (65+) | 5 | Senior centers, retirement communities, family |
| Non-English Speakers | 5 | Cultural centers, ESL classes, community groups |
| Small Business Owners | 5 | Chamber of commerce, local shops, LinkedIn |
| Tech-Savvy (control) | 3 | Team members, colleagues, friends |

**Total:** 18 participants

### Screening Questions

**For all participants:**
1. How often do you use the internet?
   - Daily / Several times a week / Less often
2. Have you ever encountered a phishing scam or suspicious website?
   - Yes / No / Not sure
3. Do you use any security tools (antivirus, password manager, etc.)?
   - List them

**For Seniors:**
- Are you comfortable using computers/tablets?
- Do you do online banking or shopping?

**For Non-English Speakers:**
- What is your primary language?
- How comfortable are you reading English?

**For Business Owners:**
- How many employees?
- Do you have IT support?
- What security concerns do you have?

---

## 🛠️ Session Setup

### Before the Session

**Technical Setup:**

1. **Choose Testing Method:**
   - **In-person:** Local server on your device
   - **Remote:** GitHub Pages link

2. **For In-Person:**
   ```bash
   cd /Users/billyward/Documents/pufferPhish/prototype
   python3 -m http.server 8000
   # Open: http://localhost:8000
   ```

3. **For Remote:**
   - Send link in advance: `https://yourteam.github.io/pufferphish/prototype/`
   - Test link works on their device
   - Have backup plan (screen share your screen)

**Materials Needed:**

- [ ] Consent form (if recording)
- [ ] Task cards (printed or digital)
- [ ] Observation checklist
- [ ] Note-taking template
- [ ] Timer
- [ ] Screen recording software (optional)
- [ ] Compensation/thank you gift

### Room/Environment Setup

**In-Person:**
- Quiet space, minimal distractions
- Participant sits with device, you observe nearby
- Audio recorder or note-taker present

**Remote:**
- Test Zoom/Meet connection beforehand
- Ask participant to share screen
- Enable cloud recording
- Have phone number as backup

---

## 📝 Session Structure (30 minutes)

### 1. Introduction (5 minutes)

**Script:**

> "Hi [Name], thank you for joining us today! I'm [Your Name] and I'm going to walk you through a short testing session for a project we're working on.
>
> **What we're testing:** We've created a prototype of a security tool that helps protect people from online scams and phishing. This is a early design, so it's not a real working product yet.
>
> **What we need from you:** We want to see how easy or difficult it is to use. There are no right or wrong answers – we're testing the design, not you!
>
> **Think aloud:** As you go through the tasks, please say out loud what you're thinking, what you're trying to do, and any questions or confusions you have.
>
> **You can stop anytime:** If you feel uncomfortable or want to stop, just let me know.
>
> **Recording:** [If recording] I'd like to record our session so we can review it later. The recording is only for our team and will be deleted after we finish analyzing the results. Is that okay with you?
>
> Do you have any questions before we begin?"

**Consent:**
- If recording, get explicit verbal consent
- Offer option to decline recording but continue session

---

### 2. Contextual Questions (5 minutes)

Ask background questions to understand their experience:

**General (ask all):**
1. How often do you use the internet?
2. What do you typically do online? (email, shopping, banking, social media)
3. Have you ever encountered a phishing email or suspicious website? What happened?
4. Do you know what "phishing" means? (Note: don't explain yet, see what they know)

**Persona-Specific:**

**Seniors:**
- Are there websites or tasks you avoid because they seem risky?
- Do family members help you with online activities?

**Non-English Speakers:**
- Which language do you prefer for websites?
- Do you ever use translation tools?

**Business Owners:**
- Have you or your employees ever fallen for a phishing scam?
- What would help you feel more secure online?

**Notes:** Write down key insights, don't judge or correct

---

### 3. Task-Based Testing (15 minutes)

Give participants specific tasks and observe their behavior.

#### **Task 1: First Impression** (2 minutes)

**Setup:** Show landing page (`index.html`)

**Instructions:**
> "Imagine you just heard about this tool from a friend. This is the first page you see. Take a moment to look around and then tell me: What do you think this product does?"

**Observe:**
- Do they understand the purpose?
- Do they notice the three interface cards?
- What draws their attention first?

**Follow-up:**
- "What would you do next?"
- "Which of these three interfaces interests you most?"

---

#### **Task 2: Understanding a Warning** (5 minutes)

**Setup:** Navigate to Extension Popup (`extension-popup.html`)

**Instructions:**
> "Imagine you've installed this tool in your browser. You click on a link in an email, and this popup appears. Take a look and tell me what you see."

**Start with Safe State:**
- "What does this tell you?"
- "Would you do anything, or just close it?"

**Switch to Warning State (click Demo button):**
- "Now what do you see?"
- "What does this mean?"
- "What would you do?"
- Observe if they read the details
- Observe if they understand "Risk Score: 58%"

**Switch to Danger State:**
- "What changed?"
- "How serious is this?"
- "What would you click?"
- Observe decision-making process

**Observe:**
- Comprehension: Do they understand severity levels?
- Color dependence: Do they rely on color alone?
- Action clarity: Is it clear what to do?
- Text readability: Do they struggle with any text?

**Key Questions:**
- "What does 'Risk Score: 92%' mean to you?"
- "If you saw the yellow warning, what would you do?"
- "Is there anything confusing here?"

---

#### **Task 3: Finding Protection Stats** (3 minutes)

**Setup:** Navigate to Dashboard (`dashboard.html`)

**Instructions:**
> "Imagine you want to see how many threats were blocked this week. How would you find that information?"

**Observe:**
- Can they find the Overview tab? (should be default)
- Do they understand the stat cards?
- Do they notice the bar chart?
- Can they interpret the timeline?

**Follow-up:**
- "What do these numbers tell you?"
- "Is this information useful?"
- "Would you check this regularly?"

---

#### **Task 4: Adjusting Settings** (3 minutes)

**Setup:** Still on Dashboard

**Instructions:**
> "You're getting too many notifications and want to turn them off. Show me how you would do that."

**Observe:**
- Can they find the Settings tab?
- Do they understand the toggle switches?
- Do they attempt to click the toggle?
- Do they understand "on" vs "off" states?

**Follow-up:**
- "What would happen if you turned off 'Real-time Protection'?"
- "Is it clear what each setting does?"

---

#### **Task 5: Reacting to an In-Page Warning** (2 minutes)

**Setup:** Navigate to Warning Demos (`warning-demos.html`)

**Instructions:**
> "Imagine you're on a website and this appears at the top of the page. [Click to show Medium Risk Banner] What would you do?"

**Observe:**
- Do they notice the banner immediately?
- Do they click "Show Details"?
- If they click, do they understand the expanded panel?
- Would they click "Leave This Site" or "I Trust This Site"?

**Show Full Interstitial:**
> "Now imagine this appears instead. [Click Full Block button] What would you do?"

**Observe:**
- Emotional reaction (surprise, concern, understanding?)
- Do they read the "DO NOT" list?
- Would they click "Go Back to Safety"?
- Do they look for a way to proceed anyway?

---

### 4. Comprehension Check (3 minutes)

Ask direct questions to assess understanding:

**Product Understanding:**
1. "In your own words, what does PufferPhish do?"
2. "Who do you think this is for?"
3. "Would you use something like this? Why or why not?"

**Feature Understanding:**
1. "What's the difference between the yellow warning and the red warning?"
2. "If you saw 'Risk Score: 85%', is that good or bad?"
3. "What does the extension popup do vs the dashboard?"

**Visual Understanding:**
1. "What does the shield icon mean?"
2. "When you see a checkmark next to a threat, what does that mean?"
3. "Are there any colors, icons, or symbols that confused you?"

---

### 5. Feedback & Closing (2 minutes)

**Open-Ended Feedback:**
1. "What did you like about this design?"
2. "What was confusing or difficult?"
3. "What would make this better?"
4. "Is there anything you expected to see but didn't?"

**Satisfaction Rating:**
1. "On a scale of 1-5, how easy was this to use?"
   - 1 = Very difficult, 5 = Very easy
2. "On a scale of 1-5, how confident do you feel about making safe decisions with this tool?"
   - 1 = Not confident, 5 = Very confident
3. "Would you recommend this to a friend or family member?"

**Thank You:**
> "Thank you so much for your time and feedback! Your input is incredibly valuable and will help us make this better for people like you. [Provide compensation/gift if applicable]"

---

## 📊 Observation Checklist

Use this during the session to track behaviors:

### Navigation

- [ ] Found all three interface cards on landing page
- [ ] Successfully switched between popup states
- [ ] Found Settings tab in dashboard
- [ ] Located protection stats on Overview
- [ ] Navigated timeline without confusion

### Understanding

- [ ] Correctly explained product purpose
- [ ] Differentiated severity levels (safe/warning/danger)
- [ ] Understood risk score percentage
- [ ] Interpreted stat cards correctly
- [ ] Knew what actions to take on warnings

### Decision-Making

- [ ] Made safe choice on warning state
- [ ] Made safe choice on danger state
- [ ] Would proceed carefully on medium risk
- [ ] Understood consequences of "Trust This Site"

### Accessibility

- [ ] Read all text without difficulty
- [ ] Noticed all interactive elements
- [ ] Could click buttons/links easily
- [ ] Didn't rely solely on color
- [ ] Understood icons and symbols

### Issues Encountered

- [ ] Got lost in navigation
- [ ] Missed important information
- [ ] Misunderstood a warning
- [ ] Expressed confusion (quote what they said)
- [ ] Made unsafe decision
- [ ] Gave up on a task

---

## 📝 Note-Taking Template

Use this for each session:

```markdown
## Session [#]

**Date:** [date]
**Participant ID:** [pseudonym/number]
**Persona:** [Senior / Non-English Speaker / Business Owner / Tech-Savvy]
**Duration:** [minutes]
**Method:** [In-person / Remote]

### Background
- Internet usage: [Daily / Weekly / Less]
- Previous phishing experience: [Yes / No / Details]
- Tech comfort level: [1-5]
- Notes: [any relevant context]

### Task 1: First Impression
- **Completed:** [Yes / No / Partially]
- **Time:** [seconds]
- **Understanding:** [Did they get it?]
- **Quote:** "[exact words]"
- **Issues:** [list]

### Task 2: Understanding a Warning
- **Safe State:**
  - Understanding: [notes]
- **Warning State:**
  - Understanding: [notes]
  - Decision: [what would they do?]
- **Danger State:**
  - Understanding: [notes]
  - Decision: [what would they do?]
- **Issues:** [list]

### Task 3: Finding Protection Stats
- **Completed:** [Yes / No]
- **Time:** [seconds]
- **Path taken:** [describe]
- **Issues:** [list]

### Task 4: Adjusting Settings
- **Completed:** [Yes / No]
- **Time:** [seconds]
- **Path taken:** [describe]
- **Understanding toggles:** [yes/no]
- **Issues:** [list]

### Task 5: In-Page Warning
- **Medium Banner:**
  - Noticed: [yes/no]
  - Decision: [what would they do?]
- **Full Interstitial:**
  - Reaction: [describe]
  - Decision: [what would they do?]
- **Issues:** [list]

### Comprehension Check
1. Product understanding: [notes]
2. Risk scores: [understood? yes/no]
3. Visual elements: [any confusion?]

### Feedback
- **Liked:** [list]
- **Disliked:** [list]
- **Suggestions:** [list]
- **Ease rating:** [1-5]
- **Confidence rating:** [1-5]
- **Would recommend:** [Yes / No / Maybe]

### Key Insights
[2-3 sentences summarizing the most important findings]

### Action Items
[Any immediate fixes or design changes this session suggests]
```

---

## 🔄 After Each Session

1. **Immediate Notes:** Write down key insights while fresh (< 30 minutes)
2. **Review Recording:** Watch/listen and note missed details
3. **Update Tracker:** Add to synthesis spreadsheet or document
4. **Identify Patterns:** After every 3-5 sessions, look for trends

---

## 📈 Synthesis Process

### After Every 5 Participants

1. **Aggregate Data:**
   - Calculate success rates per task
   - Average time to completion
   - Common pain points
   - Frequency of specific issues

2. **Affinity Mapping:**
   - Write each insight on a sticky note (digital or physical)
   - Group similar findings together
   - Label each group
   - Prioritize by frequency and severity

3. **Prioritize Issues:**

   **Critical (fix immediately):**
   - Blocks task completion
   - Causes unsafe decisions
   - Affects > 60% of participants

   **High (fix before next round):**
   - Significant confusion
   - Affects 40-60% of participants
   - Degrades experience

   **Medium (fix before hifi):**
   - Minor usability issues
   - Affects 20-40% of participants
   - Polish items

   **Low (nice-to-have):**
   - Suggestions, not problems
   - Affects < 20% of participants
   - Future enhancements

4. **Create Summary Document:**

   ```markdown
   # User Testing Results - Round [N]

   **Dates:** [date range]
   **Participants:** [#] total
   - [#] Seniors
   - [#] Non-English Speakers
   - [#] Business Owners

   ## Key Findings

   ### What Worked ✅
   1. [finding]
   2. [finding]
   3. [finding]

   ### What Didn't Work ❌
   1. [finding]
   2. [finding]
   3. [finding]

   ### Critical Issues 🚨
   1. **Issue:** [description]
      - **Impact:** [who affected, how often]
      - **Quote:** "[participant words]"
      - **Recommendation:** [fix]

   2. [repeat]

   ### Persona-Specific Insights

   **Seniors:**
   - [finding]
   - [finding]

   **Non-English Speakers:**
   - [finding]
   - [finding]

   **Business Owners:**
   - [finding]
   - [finding]

   ## Recommendations

   ### Immediate Changes (before next round)
   1. [change]
   2. [change]

   ### Future Improvements (for hifi)
   1. [improvement]
   2. [improvement]

   ## Quotes

   > "[memorable participant quote]"
   > - Participant [#], [persona]

   ## Metrics

   | Metric | Target | Actual | Status |
   |--------|--------|--------|--------|
   | Task completion | >80% | [%] | [✅/❌] |
   | Time to complete | <2min | [time] | [✅/❌] |
   | Comprehension | >90% | [%] | [✅/❌] |
   | Confidence | >4/5 | [score] | [✅/❌] |
   | Satisfaction | >4/5 | [score] | [✅/❌] |
   ```

---

## 🔧 Iteration Workflow

1. **Test → Synthesize → Prioritize → Fix → Test**

2. **Make Updates:**
   ```bash
   # Edit prototype files based on findings
   # Test locally
   python3 -m http.server 8000

   # Push updates
   git add prototype/
   git commit -m "Fix: [describe change based on user feedback]"
   git push

   # Live in 2 minutes on GitHub Pages
   ```

3. **Validate Changes:**
   - Test critical fixes with 2-3 new participants
   - Confirm improvement before continuing
   - Document validation results

4. **Repeat:**
   - Continue until task completion > 80%
   - Continue until no critical issues
   - Typically 2-3 rounds of 5 participants each

---

## ⚠️ Common Pitfalls

### Don't Lead the Participant

❌ **Wrong:** "Click on the Settings tab to find the notifications"
✅ **Right:** "How would you turn off notifications?"

### Don't Explain Immediately

❌ **Wrong:** Participant looks confused → "Oh, that's the risk score"
✅ **Right:** Participant looks confused → "What are you thinking?"

### Don't Defend the Design

❌ **Wrong:** "Well, most people understand that..."
✅ **Right:** "Thank you for that feedback. Can you tell me more?"

### Don't Skip Documentation

❌ **Wrong:** "I'll remember this later"
✅ **Right:** Write it down immediately

### Don't Test Only Tech-Savvy

❌ **Wrong:** Ask colleagues/students only
✅ **Right:** Recruit actual target personas

---

## 📞 Support

### Questions During Testing

- **Protocol questions:** [Team member who created this guide]
- **Technical issues:** See `README.md` troubleshooting section
- **Emergency contact:** [Team lead phone number]

---

## ✅ Pre-Session Checklist

Print/reference this before each session:

- [ ] Technical setup complete and tested
- [ ] Prototype loads correctly
- [ ] All state switches work
- [ ] Task cards prepared
- [ ] Observation checklist printed
- [ ] Note-taking template ready
- [ ] Recording device ready (if using)
- [ ] Consent form prepared (if recording)
- [ ] Timer accessible
- [ ] Backup plan ready (if remote)
- [ ] Compensation/thank you gift ready
- [ ] Read through script once
- [ ] 10 minutes buffer before start time

---

**Good luck with your testing sessions! Remember: Every piece of feedback is valuable, even if it's hard to hear. Your goal is to learn, not to prove the design is perfect.** 🚀
