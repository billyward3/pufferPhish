/**
 * ML Client
 * Invokes the Python ML engine for phishing detection
 * Calls local Flask API in development, AWS Lambda in production
 * Falls back to rule-based analysis if ML is unavailable
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { analyzeURL, getAnalysisMessage } from './rule-based-analysis';

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Local ML API endpoint for development
const LOCAL_ML_API = process.env.ML_API_URL || 'http://localhost:5001';

export interface MLRequest {
  url: string;
  domain: string;
  metadata?: Record<string, any>;
}

export interface MLResponse {
  riskScore: number;
  threats: {
    phishing: number;
    malware: number;
    social: number;
  };
  confidence: number;
  source: 'ml' | 'rule_based' | 'fallback';
  modelVersion: string;
  processingTime: number;
  message?: string;
  flags?: string[];
}

/**
 * Invoke ML engine for phishing analysis
 * Calls local Flask API in development, AWS Lambda in production
 * Falls back to rule-based analysis if ML is unavailable
 */
export async function invokeMLAnalysis(request: MLRequest): Promise<MLResponse> {
  const startTime = Date.now();
  const isProduction = process.env.NODE_ENV === 'production';
  const mlLambdaName = process.env.ML_LAMBDA_NAME;

  // Development: Try local Flask API first
  if (!isProduction) {
    try {
      console.log('Calling local ML API at', LOCAL_ML_API);

      const response = await fetch(`${LOCAL_ML_API}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`ML API returned ${response.status}`);
      }

      const mlResult = await response.json();

      // Combine ML result with rule-based flags for explainability
      const ruleResult = analyzeURL(request.url, request.domain);

      // Use higher risk score between ML and rules
      const combinedRiskScore = Math.max(mlResult.riskScore, ruleResult.riskScore);

      return {
        riskScore: combinedRiskScore,
        threats: {
          phishing: Math.max(mlResult.threats.phishing, ruleResult.threats.phishing * 0.5),
          malware: Math.max(mlResult.threats.malware, ruleResult.threats.malware * 0.5),
          social: Math.max(mlResult.threats.social, ruleResult.threats.social * 0.5),
        },
        confidence: mlResult.confidence,
        source: 'ml',
        modelVersion: mlResult.modelVersion,
        processingTime: Date.now() - startTime,
        message: mlResult.message,
        flags: ruleResult.flags, // Rule-based flags for explainability
      };
    } catch (error) {
      console.log('Local ML API unavailable, using rule-based:', error);

      // Fallback to rule-based in development
      const ruleResult = analyzeURL(request.url, request.domain);
      const processingTime = Date.now() - startTime;

      return {
        riskScore: ruleResult.riskScore,
        threats: ruleResult.threats,
        confidence: ruleResult.confidence,
        source: 'rule_based',
        modelVersion: 'rule-based-v1.0',
        processingTime,
        message: getAnalysisMessage(ruleResult),
        flags: ruleResult.flags,
      };
    }
  }

  // Production: Try ML Lambda
  if (!mlLambdaName) {
    console.log('ML Lambda not configured, using rule-based');
    const ruleResult = analyzeURL(request.url, request.domain);
    const processingTime = Date.now() - startTime;

    return {
      riskScore: ruleResult.riskScore,
      threats: ruleResult.threats,
      confidence: ruleResult.confidence,
      source: 'rule_based',
      modelVersion: 'rule-based-v1.0',
      processingTime,
      message: getAnalysisMessage(ruleResult),
      flags: ruleResult.flags,
    };
  }

  try {
    const command = new InvokeCommand({
      FunctionName: mlLambdaName,
      Payload: JSON.stringify(request),
    });

    const response = await lambdaClient.send(command);

    if (!response.Payload) {
      throw new Error('ML Lambda returned empty response');
    }

    // Parse Lambda response
    const payloadString = new TextDecoder().decode(response.Payload);
    const lambdaResult = JSON.parse(payloadString);

    // Lambda returns { statusCode, body } format
    if (lambdaResult.statusCode === 200) {
      const mlResponse = lambdaResult.body;

      // Combine with rule-based flags
      const ruleResult = analyzeURL(request.url, request.domain);

      return {
        ...mlResponse,
        flags: ruleResult.flags,
      };
    } else {
      console.error('ML Lambda error:', lambdaResult);
      throw new Error(`ML Lambda failed with status ${lambdaResult.statusCode}`);
    }
  } catch (error) {
    console.error('Error invoking ML Lambda, falling back to rule-based:', error);

    // Fallback to rule-based analysis if ML fails
    const ruleResult = analyzeURL(request.url, request.domain);
    const processingTime = Date.now() - startTime;

    return {
      riskScore: ruleResult.riskScore,
      threats: ruleResult.threats,
      confidence: ruleResult.confidence,
      source: 'rule_based',
      modelVersion: 'rule-based-v1.0-fallback',
      processingTime,
      message: `ML unavailable - ${getAnalysisMessage(ruleResult)}`,
      flags: ruleResult.flags,
    };
  }
}
