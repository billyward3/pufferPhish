/**
 * URL Validation and Parsing Utilities
 */

import { z } from 'zod';

// Zod schema for URL validation
export const urlSchema = z.object({
  url: z.string().url('Invalid URL format'),
  metadata: z.record(z.any()).optional(),
});

export type AnalyzeRequest = z.infer<typeof urlSchema>;

/**
 * Parse and validate URL
 */
export function parseURL(urlString: string): URL {
  try {
    return new URL(urlString);
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: URL): string {
  return url.hostname;
}

/**
 * Normalize URL for consistent cache lookups
 * Removes query params, fragments, and trailing slashes
 */
export function normalizeURL(urlString: string): string {
  try {
    const url = new URL(urlString);
    // Keep protocol + hostname + pathname, strip query and fragment
    const normalized = `${url.protocol}//${url.hostname}${url.pathname}`;
    // Remove trailing slash
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch (error) {
    return urlString;
  }
}

/**
 * Check if URL is whitelisted (always safe)
 */
export function isWhitelisted(domain: string, whitelist: string[]): boolean {
  // Exact match or subdomain match
  return whitelist.some(
    (whitelistedDomain) =>
      domain === whitelistedDomain ||
      domain.endsWith(`.${whitelistedDomain}`)
  );
}

/**
 * Common safe domains (can be overridden by user settings)
 */
export const DEFAULT_WHITELIST = [
  'google.com',
  'github.com',
  'stackoverflow.com',
  'microsoft.com',
  'apple.com',
  'amazon.com',
];
