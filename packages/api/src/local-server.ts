/**
 * Local Development Server
 * Emulates API Gateway + Lambda locally for testing
 *
 * Run: npm run dev
 */

import 'dotenv/config'; // Load .env file
import express from 'express';
import cors from 'cors';
import { handler as analyzeHandler } from './handlers/analyze';
import { handler as statsHandler } from './handlers/stats';
import { handler as settingsHandler } from './handlers/settings';
import { handler as feedbackHandler } from './handlers/feedback';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to convert Express request to Lambda event
function toLambdaEvent(req: express.Request, method: string): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: `${method} ${req.path}`,
    rawPath: req.path,
    rawQueryString: new URLSearchParams(req.query as any).toString(),
    headers: req.headers as any,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method: method,
        path: req.path,
        protocol: 'HTTP/1.1',
        sourceIp: req.ip || '127.0.0.1',
        userAgent: req.get('user-agent') || '',
      },
      requestId: `local-${Date.now()}`,
      routeKey: `${method} ${req.path}`,
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: JSON.stringify(req.body),
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

// Helper to convert Lambda response to Express response
function fromLambdaResponse(lambdaResponse: any, res: express.Response) {
  const statusCode = lambdaResponse.statusCode || 200;
  const headers = lambdaResponse.headers || {};
  const body = lambdaResponse.body;

  // Set headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value as string);
  });

  // Parse body if it's JSON string
  let responseBody = body;
  try {
    responseBody = typeof body === 'string' ? JSON.parse(body) : body;
  } catch (e) {
    responseBody = body;
  }

  res.status(statusCode).json(responseBody);
}

// Routes
app.post('/analyze', async (req, res) => {
  try {
    const event = toLambdaEvent(req, 'POST');
    const response = await (analyzeHandler as any)(event);
    fromLambdaResponse(response, res);
  } catch (error) {
    console.error('Error in /analyze:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const event = toLambdaEvent(req, 'GET');
    const response = await (statsHandler as any)(event);
    fromLambdaResponse(response, res);
  } catch (error) {
    console.error('Error in /stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/settings', async (req, res) => {
  try {
    const event = toLambdaEvent(req, 'GET');
    const response = await (settingsHandler as any)(event);
    fromLambdaResponse(response, res);
  } catch (error) {
    console.error('Error in /settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/settings', async (req, res) => {
  try {
    const event = toLambdaEvent(req, 'PUT');
    const response = await (settingsHandler as any)(event);
    fromLambdaResponse(response, res);
  } catch (error) {
    console.error('Error in /settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/feedback', async (req, res) => {
  try {
    const event = toLambdaEvent(req, 'POST');
    const response = await (feedbackHandler as any)(event);
    fromLambdaResponse(response, res);
  } catch (error) {
    console.error('Error in /feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: 'local' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Local API Server Running

Environment: development
Port: ${PORT}
URL: http://localhost:${PORT}

Available endpoints:
  POST   /analyze    - URL phishing analysis
  GET    /stats      - User statistics
  GET    /settings   - Get user settings
  PUT    /settings   - Update user settings
  POST   /feedback   - Submit feedback

Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}

Press Ctrl+C to stop
  `);
});

export default app;
