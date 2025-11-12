/**
 * ML Lambda Client
 * Invokes the Python ML Lambda for phishing detection
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

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
 */
export async function invokeMLAnalysis(request: MLRequest): Promise<MLResponse> {
  const functionName = process.env.ML_LAMBDA_NAME || 'pufferphish-ml-analyze';

  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
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
    console.error('Error invoking ML Lambda:', error);

    // Return fallback response if ML Lambda fails
    return {
      riskScore: 0.5,
      threats: {
        phishing: 0.5,
        malware: 0.0,
        social: 0.0,
      },
      confidence: 0.0,
      source: 'fallback',
      modelVersion: 'fallback-v1',
      processingTime: 0,
      message: 'ML service unavailable - using fallback assessment',
    };
  }
}
