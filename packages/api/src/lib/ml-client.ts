/**
 * ML Lambda Client
 * Invokes the Python ML Lambda for phishing detection
 * Falls back to rule-based analysis in development
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { analyzeURL, getAnalysisMessage } from './rule-based-analysis';

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

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
}

/**
 * Invoke ML Lambda for phishing analysis
 * Falls back to rule-based analysis in development or if ML is unavailable
 */
export async function invokeMLAnalysis(request: MLRequest): Promise<MLResponse> {
  const startTime = Date.now();
  const isProduction = process.env.NODE_ENV === 'production';
  const mlLambdaName = process.env.ML_LAMBDA_NAME;

  // Use rule-based analysis in development or if ML Lambda not configured
  if (!isProduction || !mlLambdaName) {
    console.log('Using rule-based analysis (development mode)');

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
    };
  }

  // Production: Try ML Lambda
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
      const mlResponse = JSON.parse(lambdaResult.body);
      return mlResponse;
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
    };
  }
}
