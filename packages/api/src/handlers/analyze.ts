import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { prisma } from '../lib/db';
import { invokeMLAnalysis } from '../lib/ml-client';
import {
  urlSchema,
  parseURL,
  extractDomain,
  normalizeURL,
  isWhitelisted,
  DEFAULT_WHITELIST,
} from '../lib/url-utils';

/**
 * Analyze Lambda Handler
 * Analyzes URLs for phishing threats
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Analyze handler invoked:', { path: event.rawPath, body: event.body });

  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validationResult = urlSchema.safeParse(body);

    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid request',
          details: validationResult.error.errors,
        }),
      };
    }

    const { url: urlString, metadata } = validationResult.data;

    // Parse URL and extract domain
    let parsedURL: URL;
    try {
      parsedURL = parseURL(urlString);
    } catch (error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid URL format',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }

    const domain = extractDomain(parsedURL);
    const normalizedURL = normalizeURL(urlString);

    console.log('Analyzing URL:', { url: urlString, domain, normalized: normalizedURL });

    // TODO: Extract userId from auth token when auth is implemented
    // For now, we'll use undefined for unauthenticated requests
    const userId: string | undefined = undefined; // Will be replaced with actual userId from JWT

    // Check if domain is whitelisted
    if (isWhitelisted(domain, DEFAULT_WHITELIST)) {
      console.log('Domain is whitelisted:', domain);

      const safeResult = {
        id: `analysis-${Date.now()}`,
        url: urlString,
        domain,
        riskScore: 0.0,
        threats: {
          phishing: 0.0,
          malware: 0.0,
          social: 0.0,
        },
        blocked: false,
        source: 'whitelist',
        confidence: 1.0,
        timestamp: new Date().toISOString(),
        message: 'Domain is on safe list',
      };

      // Store in database
      try {
        await prisma.analysis.create({
          data: {
            url: urlString,
            domain,
            riskScore: 0.0,
            threats: {
              phishing: 0.0,
              malware: 0.0,
              social: 0.0,
            },
            blocked: false,
            source: 'whitelist',
            metadata: metadata || {},
            userId, // Will be actual userId when auth is implemented
          },
        });
      } catch (dbError) {
        console.error('Error storing whitelisted analysis:', dbError);
        // Continue even if DB storage fails
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeResult),
      };
    }

    // Check cache for recent analysis (within last 24 hours)
    const CACHE_DURATION_HOURS = 24;
    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() - CACHE_DURATION_HOURS);

    let cachedAnalysis;
    try {
      cachedAnalysis = await prisma.urlCache.findFirst({
        where: {
          url: normalizedURL,
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
        orderBy: {
          checkedAt: 'desc',
        },
      });
    } catch (cacheError) {
      console.error('Error checking cache:', cacheError);
      // Continue without cache if lookup fails
    }

    if (cachedAnalysis) {
      console.log('Cache hit for URL:', normalizedURL);

      const threats = cachedAnalysis.threats as { phishing: number; malware: number; social: number };

      const cachedResult = {
        id: `analysis-cached-${Date.now()}`,
        url: urlString,
        domain,
        riskScore: cachedAnalysis.riskScore,
        threats,
        blocked: cachedAnalysis.riskScore >= 0.7,
        source: 'cache',
        confidence: 0.9,
        timestamp: new Date().toISOString(),
        message: 'Result from cache (scanned recently)',
      };

      // Store this request in analysis table (for stats)
      try {
        await prisma.analysis.create({
          data: {
            url: urlString,
            domain,
            riskScore: cachedAnalysis.riskScore,
            threats: threats,
            blocked: cachedAnalysis.riskScore >= 0.7,
            source: 'cache',
            metadata: metadata || {},
            userId,
          },
        });
      } catch (dbError) {
        console.error('Error storing cached analysis:', dbError);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedResult),
      };
    }

    // No cache hit - invoke ML Lambda for analysis
    console.log('Cache miss - invoking ML Lambda');

    const mlResponse = await invokeMLAnalysis({
      url: urlString,
      domain,
      metadata,
    });

    console.log('ML Lambda response:', mlResponse);

    const blocked = mlResponse.riskScore >= 0.7;

    const analysisResult = {
      id: `analysis-${Date.now()}`,
      url: urlString,
      domain,
      riskScore: mlResponse.riskScore,
      threats: mlResponse.threats,
      blocked,
      source: mlResponse.source,
      confidence: mlResponse.confidence,
      modelVersion: mlResponse.modelVersion,
      processingTime: mlResponse.processingTime,
      timestamp: new Date().toISOString(),
      message: mlResponse.message,
      flags: mlResponse.flags,
    };

    // Store analysis result in database
    try {
      await prisma.analysis.create({
        data: {
          url: urlString,
          domain,
          riskScore: mlResponse.riskScore,
          threats: mlResponse.threats,
          blocked,
          source: mlResponse.source,
          metadata: {
            ...metadata,
            modelVersion: mlResponse.modelVersion,
            processingTime: mlResponse.processingTime,
            confidence: mlResponse.confidence,
          },
          userId,
        },
      });

      console.log('Analysis stored in database');
    } catch (dbError) {
      console.error('Error storing analysis:', dbError);
      // Continue even if storage fails
    }

    // Update cache for future requests
    const cacheExpiresAt = new Date();
    cacheExpiresAt.setHours(cacheExpiresAt.getHours() + CACHE_DURATION_HOURS);

    try {
      await prisma.urlCache.upsert({
        where: { url: normalizedURL },
        update: {
          riskScore: mlResponse.riskScore,
          threats: mlResponse.threats,
          source: mlResponse.source,
          rawResponse: mlResponse as any,
          expiresAt: cacheExpiresAt,
        },
        create: {
          url: normalizedURL,
          riskScore: mlResponse.riskScore,
          threats: mlResponse.threats,
          source: mlResponse.source,
          rawResponse: mlResponse as any,
          expiresAt: cacheExpiresAt,
        },
      });

      console.log('Cache updated for URL:', normalizedURL);
    } catch (cacheError) {
      console.error('Error updating cache:', cacheError);
      // Continue even if cache update fails
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisResult),
    };
  } catch (error) {
    console.error('Error in analyze handler:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
