/**
 * Rule-Based Phishing Analysis
 * Analyzes URLs using heuristic rules for threat detection
 * Used for local development and as fallback when ML is unavailable
 */

export interface RuleAnalysisResult {
  riskScore: number;
  threats: {
    phishing: number;
    malware: number;
    social: number;
  };
  confidence: number;
  flags: string[];
  details: {
    urlPatterns: number;
    domainReputation: number;
    contentIndicators: number;
  };
}

// Suspicious TLDs commonly used in phishing
const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', // Free TLDs
  '.top', '.xyz', '.club', '.work', '.click',
  '.link', '.loan', '.download', '.racing',
];

// High-risk keywords in domains
const PHISHING_KEYWORDS = [
  'verify', 'account', 'secure', 'update', 'confirm',
  'login', 'signin', 'banking', 'paypal', 'amazon',
  'apple', 'microsoft', 'google', 'facebook',
  'suspended', 'limited', 'unusual', 'activity',
];

// Popular brand names that shouldn't appear in URL paths
const BRAND_NAMES = [
  'paypal.com', 'amazon.com', 'amazon.co.uk', 'apple.com',
  'microsoft.com', 'google.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'linkedin.com', 'netflix.com', 'ebay.com',
  'alibaba.com', 'aliexpress.com', 'bankofamerica.com', 'chase.com',
  'wellsfargo.com', 'citibank.com', 'americanexpress.com',
];

// Homoglyph characters (look-alike characters)
const HOMOGLYPH_PATTERNS = /[òóôõöōŏőơǒǫọộốồổỗớờởỡợ]/gi;

/**
 * Main rule-based analysis function
 */
export function analyzeURL(url: string, domain: string): RuleAnalysisResult {
  const flags: string[] = [];
  let urlScore = 0;
  let domainScore = 0;
  let contentScore = 0;

  // === URL PATTERN ANALYSIS ===

  // Check for IP address instead of domain
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
    urlScore += 0.4;
    flags.push('Uses IP address instead of domain name');
  }

  // Check for suspicious TLD
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
  if (hasSuspiciousTLD) {
    urlScore += 0.2;
    flags.push('Suspicious top-level domain');
  }

  // Check for @ symbol in URL (credential phishing)
  if (url.includes('@')) {
    urlScore += 0.3;
    flags.push('Contains @ symbol (potential credential theft)');
  }

  // Check for excessive subdomains (e.g., secure.login.paypal.fake.com)
  const subdomainCount = domain.split('.').length - 2;
  if (subdomainCount > 8) {
    urlScore += 1.0;
    flags.push('CRITICAL: Extreme subdomain depth (classic typosquatting attack)');
  } else if (subdomainCount > 5) {
    urlScore += 0.7;
    flags.push('Highly suspicious subdomain structure (possible typosquatting)');
  } else if (subdomainCount > 3) {
    urlScore += 0.4;
    flags.push('Excessive subdomains detected');
  }

  // Check for URL encoding tricks (%, %2F, etc.)
  const encodedChars = (url.match(/%[0-9A-F]{2}/gi) || []).length;
  if (encodedChars > 3) {
    urlScore += 0.15;
    flags.push('Excessive URL encoding');
  }

  // Check for very long URLs (obfuscation technique)
  if (url.length > 150) {
    urlScore += 0.1;
    flags.push('Unusually long URL');
  }

  // === DOMAIN REPUTATION ANALYSIS ===

  // Check for homoglyph/lookalike characters
  if (HOMOGLYPH_PATTERNS.test(domain)) {
    domainScore += 0.35;
    flags.push('Contains look-alike characters (homoglyphs)');
  }

  // Check for phishing keywords in domain
  const keywordMatches = PHISHING_KEYWORDS.filter(keyword =>
    domain.toLowerCase().includes(keyword)
  );
  if (keywordMatches.length > 0) {
    // More aggressive scoring for multiple keywords (common in phishing)
    const keywordScore = Math.min(keywordMatches.length * 0.2, 0.6);
    domainScore += keywordScore;

    // Extra penalty if multiple high-risk keywords combined
    if (keywordMatches.length >= 3) {
      domainScore += 0.2;
      flags.push(`Multiple suspicious keywords detected: ${keywordMatches.join(', ')} (HIGH RISK)`);
    } else {
      flags.push(`Contains suspicious keywords: ${keywordMatches.join(', ')}`);
    }
  }

  // Check for numbers in unusual positions (e.g., paypa1.com)
  const numberPattern = /[a-z]\d+|^\d+[a-z]/i;
  if (numberPattern.test(domain.split('.')[0])) {
    domainScore += 0.25;
    flags.push('Numbers mixed with letters in domain');
  }

  // Check for domain length (very short or very long)
  const mainDomain = domain.split('.')[0];
  if (mainDomain.length < 3) {
    domainScore += 0.1;
    flags.push('Unusually short domain name');
  } else if (mainDomain.length > 50) {
    domainScore += 0.4;
    flags.push('Extremely long domain name (strong phishing indicator)');
  } else if (mainDomain.length > 30) {
    domainScore += 0.2;
    flags.push('Unusually long domain name');
  }

  // Check for repeated characters (e.g., paaaypaal.com)
  const repeatedChars = /(.)\1{3,}/.test(domain);
  if (repeatedChars) {
    domainScore += 0.2;
    flags.push('Repeated characters in domain');
  }

  // Check for hyphens (often used in typosquatting)
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount > 2) {
    domainScore += 0.15;
    flags.push('Multiple hyphens in domain');
  }

  // === CONTENT INDICATORS ===

  // Check for common phishing URL patterns
  const phishingPatterns = [
    /\/login/i,
    /\/signin/i,
    /\/verify/i,
    /\/account/i,
    /\/secure/i,
    /\/update/i,
  ];

  const patternMatches = phishingPatterns.filter(pattern => pattern.test(url));
  if (patternMatches.length > 1) {
    contentScore += 0.2;
    flags.push('URL path contains suspicious authentication patterns');
  }

  // Check for data URIs (sometimes used for phishing)
  if (url.startsWith('data:')) {
    contentScore += 0.3;
    flags.push('Uses data URI (potential embedded phishing)');
  }

  // Check for misleading ports
  const portMatch = url.match(/:(\d+)/);
  if (portMatch && !['80', '443', '8080', '3000'].includes(portMatch[1])) {
    contentScore += 0.1;
    flags.push('Uses non-standard port');
  }

  // Check for brand name spoofing in URL path (e.g., fake.com/paypal.com/login)
  const urlPath = url.toLowerCase();
  const brandMatches = BRAND_NAMES.filter(brand => {
    // Only flag if brand appears in path but NOT in the actual domain
    return urlPath.includes(brand) && !domain.toLowerCase().includes(brand.replace('.com', '').replace('.co.uk', ''));
  });

  if (brandMatches.length > 0) {
    urlScore += 0.8; // Very high score for path-based brand spoofing
    flags.push(`Brand name spoofing in URL path: ${brandMatches.join(', ')} (CRITICAL)`);
  }

  // === CALCULATE FINAL SCORES ===

  // Use maximum of individual scores or weighted average, whichever is higher
  // This ensures extreme indicators (like 10+ subdomains) directly set high risk
  const weightedRisk = (urlScore * 0.4) + (domainScore * 0.4) + (contentScore * 0.2);
  const maxIndividualRisk = Math.max(urlScore, domainScore, contentScore);
  const totalRisk = Math.min(Math.max(weightedRisk, maxIndividualRisk * 0.9), 1.0);

  // Distribute risk across threat categories
  const phishingThreat = Math.min(domainScore + contentScore * 0.5, 1.0);
  const malwareThreat = Math.min(urlScore * 0.3 + contentScore * 0.3, 1.0);
  const socialThreat = Math.min(domainScore * 0.6 + contentScore * 0.4, 1.0);

  // Confidence based on number of flags
  const confidence = Math.min(flags.length * 0.15, 0.95);

  return {
    riskScore: Math.round(totalRisk * 100) / 100,
    threats: {
      phishing: Math.round(phishingThreat * 100) / 100,
      malware: Math.round(malwareThreat * 100) / 100,
      social: Math.round(socialThreat * 100) / 100,
    },
    confidence: Math.round(confidence * 100) / 100,
    flags,
    details: {
      urlPatterns: Math.round(urlScore * 100) / 100,
      domainReputation: Math.round(domainScore * 100) / 100,
      contentIndicators: Math.round(contentScore * 100) / 100,
    },
  };
}

/**
 * Get risk level description
 */
export function getRiskLevel(riskScore: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore < 0.2) return 'safe';
  if (riskScore < 0.4) return 'low';
  if (riskScore < 0.6) return 'medium';
  if (riskScore < 0.8) return 'high';
  return 'critical';
}

/**
 * Generate human-readable message based on analysis
 */
export function getAnalysisMessage(result: RuleAnalysisResult): string {
  const riskLevel = getRiskLevel(result.riskScore);

  if (result.flags.length === 0) {
    return 'No suspicious patterns detected';
  }

  const flagSummary = result.flags.slice(0, 3).join('; ');

  switch (riskLevel) {
    case 'safe':
      return 'Minimal risk detected';
    case 'low':
      return `Low risk: ${flagSummary}`;
    case 'medium':
      return `Moderate risk: ${flagSummary}`;
    case 'high':
      return `High risk: ${flagSummary}`;
    case 'critical':
      return `Critical risk: ${flagSummary}`;
  }
}
