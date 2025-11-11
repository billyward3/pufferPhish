# Backend & Infrastructure Implementation Guide

**Owner:** Backend Team (You)
**Timeline:** Rapid MVP Deployment
**Integration Partners:** ML Team, Extension Team

## Overview

This guide covers the backend API, database, infrastructure, and web dashboard implementation. The focus is on a minimal viable product that can be deployed quickly while maintaining quality and security.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│ Chrome Extension│────────▶│ API Gateway HTTP │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Lambda Functions│
                            │ - analyze       │
                            │ - stats         │
                            │ - settings      │
                            └─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │   Cognito    │ │  Database    │ │  S3 Bucket   │
            │   (Auth)     │ │  (Postgres)  │ │  (ML Models) │
            └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────┐         ┌──────────────────┐
│ React Dashboard │────────▶│   Static Host    │
└─────────────────┘         │   (S3 or Vercel) │
                            └──────────────────┘
```

## Core Components

### 1. API Layer (Lambda + API Gateway)

**Required Endpoints:**
- `POST /analyze` - Analyze URL for threats
- `POST /feedback` - Submit user feedback
- `GET /stats` - Get user statistics
- `GET /settings` - Get user preferences
- `PUT /settings` - Update preferences
- `POST /settings/whitelist` - Add domain to whitelist
- `GET /health` - Health check (no auth)

### 2. Database (PostgreSQL)

**Simplified Schema for MVP:**
```prisma
model User {
  id            String   @id @default(uuid())
  cognitoId     String   @unique
  email         String   @unique
  createdAt     DateTime @default(now())

  analyses      Analysis[]
  feedback      Feedback[]
  settings      UserSettings?
}

model UserSettings {
  id                String   @id @default(uuid())
  userId            String   @unique
  autoBlock         Boolean  @default(true)
  notifications     Boolean  @default(true)
  whitelistedDomains String[]

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Analysis {
  id            String   @id @default(uuid())
  userId        String
  url           String   @db.Text
  domain        String
  riskScore     Float
  threats       Json
  blocked       Boolean
  source        String
  timestamp     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  feedback      Feedback?

  @@index([userId, timestamp(sort: Desc)])
  @@index([domain])
}

model Feedback {
  id            String   @id @default(uuid())
  analysisId    String   @unique
  userId        String
  correct       Boolean
  actualThreat  String?
  comment       String?  @db.Text
  timestamp     DateTime @default(now())

  analysis      Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Optional: Cache for performance
model UrlCache {
  url           String   @id
  riskScore     Float
  threats       Json
  source        String
  checkedAt     DateTime @default(now())
  expiresAt     DateTime

  @@index([expiresAt])
}
```

### 3. Authentication (AWS Cognito)

**Simplified Setup:**
- User Pool for user management
- Hosted UI for sign-up/sign-in (fastest option)
- JWT token validation in API Gateway
- No custom authorizers needed (use built-in)

### 4. Web Dashboard (React)

**Core Features:**
- User authentication (Cognito hosted UI)
- Statistics visualization
- Settings management
- Analysis history
- Extension download/setup instructions

## Rapid Deployment Strategy

### Option A: Full AWS (More Complex, Production-Ready)

**Pros:** Complete control, scales well
**Cons:** More setup time, costs ~$20-50/month
**Time:** 4-6 hours initial setup

### Option B: Hybrid (Recommended for Rapid MVP)

**Pros:** Faster setup, lower cost, easier iteration
**Cons:** Multiple services to manage
**Time:** 2-3 hours initial setup

**Components:**
- **Database:** Supabase (free tier, hosted Postgres)
- **API:** AWS Lambda + API Gateway (serverless, pay per use)
- **Auth:** Supabase Auth OR AWS Cognito
- **ML Storage:** S3 (cheap, fast)
- **Dashboard:** Vercel (free hosting, auto-deploy)

### Option C: Minimal Local (Development Only)

**Pros:** Fastest to start
**Cons:** Not accessible to extension, testing only
**Time:** 30 minutes

**Components:**
- **Database:** Docker Postgres
- **API:** Local Express server
- **Dashboard:** Local React dev server

## Recommended: Hybrid Approach

### Step 1: Database Setup (Supabase)

```bash
# 1. Create Supabase account at supabase.com
# 2. Create new project
# 3. Copy connection string
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# 4. Set up Prisma
cd packages/database
npx prisma init
# Paste connection string in .env

# 5. Create schema
npx prisma db push

# 6. Generate client
npx prisma generate
```

**Why Supabase:**
- Free tier includes 500MB database
- Hosted, no management needed
- Built-in auth (alternative to Cognito)
- Auto-backups
- Connection pooling included
- Can migrate to RDS later

### Step 2: Lambda Functions

**Structure:**
```
packages/api/
├── src/
│   ├── handlers/
│   │   ├── analyze.ts      # POST /analyze
│   │   ├── stats.ts        # GET /stats
│   │   ├── settings.ts     # GET/PUT /settings
│   │   ├── feedback.ts     # POST /feedback
│   │   └── health.ts       # GET /health
│   ├── utils/
│   │   ├── database.ts     # Prisma client
│   │   ├── auth.ts         # JWT validation
│   │   └── ml-client.ts    # Invoke ML Lambda
│   └── types/
│       └── index.ts        # Shared types
├── package.json
└── tsconfig.json
```

**Example Handler (analyze.ts):**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { invokeMlLambda } from '../utils/ml-client';
import { validateToken } from '../utils/auth';

const prisma = new PrismaClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Validate auth
    const userId = await validateToken(event.headers.authorization);

    // 2. Parse request
    const { url, metadata } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL required' })
      };
    }

    // 3. Extract domain
    const domain = new URL(url).hostname;

    // 4. Check cache
    const cached = await prisma.urlCache.findFirst({
      where: {
        url: url,
        expiresAt: { gt: new Date() }
      }
    });

    if (cached) {
      // Return cached result
      return {
        statusCode: 200,
        body: JSON.stringify({
          analysisId: 'cached',
          url,
          domain,
          ...cached,
          cached: true
        })
      };
    }

    // 5. Call ML Lambda
    const mlResult = await invokeMlLambda({ url, domain, metadata });

    // 6. Store analysis
    const analysis = await prisma.analysis.create({
      data: {
        userId: userId,
        url: url,
        domain: domain,
        riskScore: mlResult.riskScore,
        threats: mlResult.threats,
        blocked: mlResult.riskScore >= 0.8,
        source: mlResult.source
      }
    });

    // 7. Cache result
    await prisma.urlCache.create({
      data: {
        url: url,
        riskScore: mlResult.riskScore,
        threats: mlResult.threats,
        source: mlResult.source,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      }
    });

    // 8. Return response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        analysisId: analysis.id,
        url,
        domain,
        riskScore: mlResult.riskScore,
        threats: mlResult.threats,
        blocked: analysis.blocked,
        source: mlResult.source,
        recommendation: mlResult.riskScore >= 0.8 ? 'block' :
                        mlResult.riskScore >= 0.5 ? 'warn' : 'allow',
        explanation: generateExplanation(mlResult)
      })
    };

  } catch (error) {
    console.error('Analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function generateExplanation(mlResult: any): string {
  if (mlResult.riskScore >= 0.8) {
    return 'High phishing probability detected. This site is trying to steal your information.';
  } else if (mlResult.riskScore >= 0.5) {
    return 'This site shows suspicious characteristics. Proceed with caution.';
  } else if (mlResult.riskScore >= 0.3) {
    return 'Minor security concerns detected. Exercise normal caution.';
  } else {
    return 'This site appears to be safe.';
  }
}
```

### Step 3: Simple CDK Deployment

**Simplified Single-Stack CDK:**

```typescript
// infrastructure/lib/pufferphish-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class PufferPhishStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for ML models
    const modelBucket = new s3.Bucket(this, 'ModelBucket', {
      bucketName: 'pufferphish-ml-models',
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true
      }
    });

    const userPoolClient = userPool.addClient('AppClient', {
      authFlows: {
        userPassword: true,
        userSrp: true
      }
    });

    // Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset('layers/shared'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X]
    });

    // Analyze Lambda
    const analyzeLambda = new lambda.Function(this, 'AnalyzeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'analyze.handler',
      code: lambda.Code.fromAsset('../packages/api/dist'),
      layers: [sharedLayer],
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!,
        ML_LAMBDA_NAME: 'pufferphish-ml-analyze'
      }
    });

    // Stats Lambda
    const statsLambda = new lambda.Function(this, 'StatsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'stats.handler',
      code: lambda.Code.fromAsset('../packages/api/dist'),
      layers: [sharedLayer],
      timeout: cdk.Duration.seconds(10),
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!
      }
    });

    // Settings Lambda
    const settingsLambda = new lambda.Function(this, 'SettingsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'settings.handler',
      code: lambda.Code.fromAsset('../packages/api/dist'),
      layers: [sharedLayer],
      timeout: cdk.Duration.seconds(10),
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!
      }
    });

    // Feedback Lambda
    const feedbackLambda = new lambda.Function(this, 'FeedbackLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'feedback.handler',
      code: lambda.Code.fromAsset('../packages/api/dist'),
      layers: [sharedLayer],
      timeout: cdk.Duration.seconds(10),
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!
      }
    });

    // API Gateway HTTP API
    const api = new apigateway.HttpApi(this, 'Api', {
      apiName: 'pufferphish-api',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*']
      }
    });

    // Add routes
    api.addRoutes({
      path: '/analyze',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway.HttpLambdaIntegration('AnalyzeIntegration', analyzeLambda)
    });

    api.addRoutes({
      path: '/stats',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway.HttpLambdaIntegration('StatsIntegration', statsLambda)
    });

    api.addRoutes({
      path: '/settings',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT],
      integration: new apigateway.HttpLambdaIntegration('SettingsIntegration', settingsLambda)
    });

    api.addRoutes({
      path: '/feedback',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway.HttpLambdaIntegration('FeedbackIntegration', feedbackLambda)
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url!,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'ModelBucketName', {
      value: modelBucket.bucketName,
      description: 'S3 Bucket for ML Models'
    });
  }
}
```

**Deploy:**
```bash
cd infrastructure
npm install
export DATABASE_URL="your-supabase-connection-string"
npx cdk bootstrap  # First time only
npx cdk deploy
```

### Step 4: Dashboard Deployment (Vercel)

**Quick Setup:**
```bash
cd packages/dashboard

# 1. Create .env.local
cat > .env.local <<EOF
VITE_API_URL=https://your-api-gateway-url
VITE_USER_POOL_ID=your-cognito-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
EOF

# 2. Test locally
npm install
npm run dev

# 3. Deploy to Vercel
npm install -g vercel
vercel --prod

# Follow prompts, add environment variables
# Dashboard live in ~2 minutes
```

### Step 5: Authentication Integration

**Using Supabase Auth (Simplest):**

```typescript
// packages/api/src/utils/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function validateToken(authHeader?: string): Promise<string> {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid token');
  }

  return data.user.id;
}
```

**Extension Integration:**
```typescript
// In extension: Get token from Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Store token
chrome.storage.local.set({
  authToken: data.session.access_token
});

// Use in API calls
const response = await fetch(`${API_URL}/analyze`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## API Implementation Details

### URL Analysis Flow

```typescript
// 1. Extension sends request
POST /analyze
{
  "url": "https://suspicious-site.com",
  "metadata": { "userAction": "click" }
}

// 2. Lambda handler processes:
async function handleAnalyze(event) {
  // a. Validate auth token
  const userId = await validateToken(event.headers.authorization);

  // b. Check cache
  const cached = await checkCache(url);
  if (cached && !expired(cached)) {
    return cached;
  }

  // c. Call ML Lambda
  const mlResult = await invokeMlLambda({ url, domain });

  // d. Store in database
  const analysis = await prisma.analysis.create({...});

  // e. Update cache
  await updateCache(url, mlResult);

  // f. Return result
  return formatResponse(analysis, mlResult);
}

// 3. Response to extension
{
  "analysisId": "uuid",
  "url": "https://suspicious-site.com",
  "domain": "suspicious-site.com",
  "riskScore": 0.92,
  "threats": {
    "phishing": 0.92,
    "malware": 0.15,
    "social": 0.78
  },
  "blocked": true,
  "source": "ml",
  "recommendation": "block",
  "explanation": "High phishing probability detected..."
}
```

### Statistics Aggregation

```typescript
// GET /stats?timeRange=week
export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = await validateToken(event.headers.authorization);
  const timeRange = event.queryStringParameters?.timeRange || 'all_time';

  // Calculate date range
  const startDate = getStartDate(timeRange);

  // Aggregate from database
  const [totalScans, threatsBlocked, breakdown] = await Promise.all([
    prisma.analysis.count({
      where: { userId, timestamp: { gte: startDate } }
    }),
    prisma.analysis.count({
      where: { userId, blocked: true, timestamp: { gte: startDate } }
    }),
    prisma.analysis.groupBy({
      by: ['blocked'],
      where: { userId, timestamp: { gte: startDate } },
      _count: true
    })
  ]);

  const recentThreats = await prisma.analysis.findMany({
    where: { userId, blocked: true },
    orderBy: { timestamp: 'desc' },
    take: 5,
    select: { url, timestamp, riskScore }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      totalScans,
      threatsBlocked,
      protectionRate: totalScans > 0 ? (totalScans - threatsBlocked) / totalScans : 1.0,
      recentThreats,
      timeRange
    })
  };
};
```

## Dashboard Implementation

### Core Pages

**1. Authentication Page:**
- Use Supabase Auth UI component (fastest)
- Or implement custom login/signup with Cognito

**2. Overview Dashboard:**
```tsx
function Dashboard() {
  const { data: stats } = useQuery('stats', () =>
    fetch('/api/stats?timeRange=week').then(r => r.json())
  );

  return (
    <div className="dashboard">
      <StatsCards stats={stats} />
      <ThreatChart data={stats.daily} />
      <RecentThreats threats={stats.recentThreats} />
    </div>
  );
}
```

**3. Settings Page:**
```tsx
function Settings() {
  const { data: settings, mutate } = useSettings();

  return (
    <div className="settings">
      <Toggle
        label="Auto-block dangerous sites"
        checked={settings.autoBlock}
        onChange={(v) => mutate({ autoBlock: v })}
      />
      <WhitelistManager domains={settings.whitelistedDomains} />
    </div>
  );
}
```

**4. History Page:**
- Table of all analyzed URLs
- Filter by date, risk level
- Export functionality

## Testing Strategy

### Local Development
```bash
# Terminal 1: Start database
docker-compose up

# Terminal 2: Run API locally
cd packages/api
npm run dev

# Terminal 3: Run dashboard
cd packages/dashboard
npm run dev

# Terminal 4: Test extension
cd packages/extension
npm run dev
# Load unpacked in Chrome
```

### Integration Testing
```typescript
// test analyze endpoint
const response = await fetch('http://localhost:3002/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
  },
  body: JSON.stringify({
    url: 'https://test-phishing.com'
  })
});

const result = await response.json();
assert(result.riskScore >= 0 && result.riskScore <= 1);
assert(result.analysisId);
```

## Deployment Checklist

### Pre-Deployment
- [ ] Database schema deployed (Prisma)
- [ ] Environment variables configured
- [ ] API endpoints tested locally
- [ ] Extension can authenticate
- [ ] ML Lambda integration working
- [ ] Dashboard builds successfully

### Deploy
- [ ] Deploy Lambda functions (CDK)
- [ ] Get API Gateway URL
- [ ] Update extension with API URL
- [ ] Deploy dashboard (Vercel)
- [ ] Test end-to-end flow
- [ ] Monitor CloudWatch logs

### Post-Deployment
- [ ] Extension can call API
- [ ] Authentication works
- [ ] URL analysis returns results
- [ ] Dashboard displays data
- [ ] No errors in logs
- [ ] Performance acceptable (<1s response)

## Cost Estimates

### MVP Costs (100-1000 users)
- **Supabase:** $0 (free tier)
- **Lambda:** $5-10/month (pay per request)
- **API Gateway:** $3-5/month
- **S3:** $1-2/month (ML models)
- **Cognito:** $0 (50k free MAU)
- **Vercel:** $0 (free tier)
- **Total:** ~$10-20/month

## Troubleshooting

### Common Issues

**1. CORS Errors:**
```typescript
// Add to API responses
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
}
```

**2. Database Connection Issues:**
```bash
# Test connection
npx prisma db pull

# Check connection string format
# Should be: postgresql://user:pass@host:5432/db?connection_limit=1
```

**3. Lambda Timeout:**
```typescript
// Increase timeout in CDK
timeout: cdk.Duration.seconds(30)

// Or optimize query
const result = await prisma.analysis.findMany({
  take: 10,  // Limit results
  select: { id: true, url: true }  // Only needed fields
});
```

**4. Extension Can't Authenticate:**
- Check CORS on API
- Verify API URL in extension
- Check token format
- Validate Cognito/Supabase configuration

## Next Steps After MVP

Once MVP is working:
1. Add monitoring (CloudWatch dashboards)
2. Implement rate limiting
3. Add caching layer (Redis/ElastiCache)
4. Optimize database queries
5. Add comprehensive tests
6. Set up CI/CD pipeline
7. Implement proper error tracking (Sentry)
8. Add analytics

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **AWS Lambda:** https://docs.aws.amazon.com/lambda/
- **API Gateway:** https://docs.aws.amazon.com/apigateway/
- **Prisma:** https://www.prisma.io/docs/
- **Vercel:** https://vercel.com/docs
