# Local API Testing Guide

Test your Lambda functions locally without deploying to AWS.

## Quick Start

```bash
# Start local server
cd packages/api
npm run dev
```

Server runs at: `http://localhost:3001`

## How It Works

The local server (`src/local-server.ts`) wraps your Lambda handlers in Express.js:
- Converts HTTP requests → Lambda events
- Executes your actual handler code
- Converts Lambda responses → HTTP responses

**Same code runs locally and in production** - no mocks or emulation.

## Available Endpoints

```bash
# URL Analysis
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "metadata": {}}'

# User Statistics
curl http://localhost:3001/stats

# Get Settings
curl http://localhost:3001/settings

# Update Settings
curl -X PUT http://localhost:3001/settings \
  -H "Content-Type: application/json" \
  -d '{"autoBlock": false, "notifications": true}'

# Submit Feedback
curl -X POST http://localhost:3001/feedback \
  -H "Content-Type: application/json" \
  -d '{"analysisId": "test-123", "correct": true, "comment": "Good"}'

# Health Check
curl http://localhost:3001/health
```

## Development Workflow

1. **Make changes** to handlers (e.g., `src/handlers/analyze.ts`)
2. **Server auto-reloads** (thanks to nodemon)
3. **Test with curl** or your extension/dashboard
4. **Deploy when ready**: `cd ../../infrastructure && npx cdk deploy`

## Environment Variables

Create `packages/api/.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:***@db.snmrvupugzfdlvpgewwt.supabase.co:5432/postgres

# Auth (optional)
USER_POOL_ID=us-east-1_tihggBXaW
USER_POOL_CLIENT_ID=3rou6qoa8he7c9hhdckricutbl

# AWS (optional for local testing)
AWS_REGION=us-east-1

# Server
PORT=3001
NODE_ENV=development
```

## Testing with Dashboard

Update dashboard `.env`:

```bash
# For local API testing
VITE_API_URL=http://localhost:3001

# For production API
VITE_API_URL=https://3z45fwde75.execute-api.us-east-1.amazonaws.com
```

## Testing with Extension

Update extension environment:

```javascript
// packages/extension/src/config.ts
const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : 'https://3z45fwde75.execute-api.us-east-1.amazonaws.com';
```

## Debugging

**Enable verbose logging:**
```bash
# In src/local-server.ts
console.log('Lambda event:', JSON.stringify(event, null, 2));
console.log('Lambda response:', JSON.stringify(response, null, 2));
```

**Test specific handler directly:**
```typescript
import { handler } from './handlers/analyze';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

const event: APIGatewayProxyEventV2 = {
  body: JSON.stringify({ url: 'https://test.com' }),
  // ... other fields
};

const result = await handler(event, {} as any);
console.log(result);
```

## Comparison: Local vs AWS

| Feature | Local (`npm run dev`) | AWS (`cdk deploy`) |
|---------|----------------------|-------------------|
| Speed | Instant (no deploy) | 2-3 minutes |
| Database | Real Supabase | Real Supabase |
| Auth | Optional | Cognito/Supabase |
| ML Lambda | Not called | Called via AWS |
| CORS | Handled by Express | API Gateway |
| Logs | Terminal | CloudWatch |
| Cost | Free | AWS charges |

## Common Issues

**Port already in use:**
```bash
# Change port
PORT=3002 npm run dev
```

**Database connection fails:**
```bash
# Check .env has correct DATABASE_URL
# Test connection:
npx prisma db pull
```

**TypeScript errors:**
```bash
# Rebuild
npm run build
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

When ready to deploy:

```bash
# Build handlers
cd packages/api
npm run build

# Deploy to AWS
cd ../../infrastructure
npx cdk deploy

# Test production endpoints
curl -X POST https://3z45fwde75.execute-api.us-east-1.amazonaws.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Alternative: AWS SAM Local

If you prefer AWS SAM CLI:

```bash
# Install SAM CLI
brew install aws-sam-cli

# Start local API Gateway + Lambda
sam local start-api

# Invoke specific function
sam local invoke AnalyzeFunction -e events/analyze.json
```

**Note**: SAM Local requires Docker and is slower than our Express server.
