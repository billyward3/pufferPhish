EECS 497: Major Design Projects
Initial Project Concept Document
Team: 49
Members: James Choi (jameskc), William Ward (wilward), Gabe Hutteman (gabehutt)
Product Name: PufferPhish
Part 1: Project Description and Problem Statement

The Problem
Current phishing detection solutions are fundamentally reactive, meaning that they depend on community reporting and known threat databases that only protect users after victims have already been compromised. Phishing sites can remain active for days before being reported and blocked, during which thousands of users may fall victim. Furthermore, existing browser-based protection tools often fail to educate users (especially the elderly) about why a site was flagged, missing critical opportunities to build long-term security awareness.

Our Solution: PufferPhish
PufferPhish is an ML-powered, multi-platform phishing detection system that provides real-time, proactive protection against phishing attacks. Our system combines machine learning models with multi-vector analysis (URL patterns, content analysis, visual similarity detection, and behavioral patterns) to predict and prevent threats before they victimize users. Unlike traditional blocklist-based approaches, PufferPhish utilizes ML to learn and adapt to emerging threats while maintaining user privacy through on-device processing and selective cloud analysis.

Key Innovation
Our ML approach flexibly transforms potential threats into educational opportunities by explaining why sites are flagged as suspicious, helping users develop better security intuition over time rather than simply blocking threats silently.


Part 2: "Not-Only-You" Mindset and Target Audiences

Our team consists of three technically proficient computer science students who are comfortable with security concepts and technical jargon. However, PufferPhish is designed for several user groups that differ substantially from our team, who all want protection from phishing, but in different ways:

Primary "Not-Only-You" Audiences:

1. Senior Citizens (65+ years old)
• How they differ from our team: Limited technical literacy, may struggle with security concepts, more susceptible to social engineering
• How we meet their needs: 
  - Simplified, large-text warnings with clear visual indicators (red/yellow/green)
  - Plain language explanations avoiding technical terms (e.g. “This is a scam!”)

2. Non-English Speaking Users
• How they differ from our team: Primary language barriers, different cultural contexts for trust signals
• How we meet their needs:
  - Visual/icon-based warnings (e.g. Warning sign with “!”)
  - The word “Warning” that matches the browser’s language

3. Small Business Owners Without IT Departments
• How they differ from our team: Need protection without technical expertise
• How we meet their needs:
  - Automated reports in business-friendly language
  - Minimal setup and overhead

Meeting the "Not-Only-You" Requirements
Our project addresses the issues discussed in the Technically Wrong lecture by:
• Avoiding implicit biases: Testing with diverse user groups, not assuming technical literacy, working to be equitable to different socioeconomic and intellectual groups
• Diverse training data: ML models trained on phishing attempts from multiple countries and languages and from different phishing sources
• Ethical considerations: Privacy-preserving design that doesn't discriminate based on browsing habits. No url or website is favored over another.


Part 3: User Interface Description

PufferPhish provides three primary user interface touchpoints:

1. Browser Extension Popup Interface (main UI)
• Instant Status Indicator: Traffic light system (green/yellow/red) visible at a glance
• Threat Analysis Panel: 
  - Current page risk score with simple percentage
  - Plain-language explanation of detected issues
• Quick Actions:
  - Large, clearly labeled "Block Site" and "Trust Site" buttons
  - "Learn More" expands educational content
  - "Report False Positive" with simple form
• Accessibility: Full keyboard navigation, screen reader support

2. Web Dashboard
• Protection Overview:
  - Large, easy-to-read statistics cards showing threats blocked
  - Timeline visualization of protection events
  - Simplified threat categories with icons
• Settings Management:
  - Slider-based sensitivity controls (Basic/Balanced/Strict)
  - Whitelist management with search functionality
  - Account Deletion

3. In-Page Warning Overlays
• Non-Intrusive Alerts: Slide-in notifications that don't block content initially
• Progressive Disclosure:
  - Level 1: Simple warning banner with risk level
  - Level 2: Detailed explanation panel on request
  - Level 3: Full-page interstitial for high-risk sites
• Educational Elements:
  - Hover tooltips explaining suspicious elements


Summary

PufferPhish represents an advancement in phishing protection by combining proactive ML-powered detection with inclusive, educational design. By explicitly designing for users unlike ourselves, we ensure our solution addresses the real-world diversity of internet users who need protection most. Regardless of technical proficiency, language, or ability, every user can benefit from phishing protection while building their security awareness over time.
