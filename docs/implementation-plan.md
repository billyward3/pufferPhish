# PufferPhish Backend Implementation Plan

**Objective:** Deploy working MVP with backend API, database, authentication, and dashboard

**Estimated Time:** 2-3 hours

**Target Date:** Today

---

## Phase 1: Database Setup (15-20 minutes)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Fill in details:
   - Name: `pufferphish-mvp`
   - Database Password: Generate strong password (save securely)
   - Region: Choose closest region
   - Pricing plan: Free

**Wait for provisioning (2-3 minutes)**

### 1.2 Configure Database Schema

```bash
# Navigate to database package
cd packages/database

# Install dependencies if not already installed
npm install

# Set DATABASE_URL in .env
echo "DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" > .env

# Push schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# Verify connection
npx prisma db pull
```

**Expected outcome:**
- ✅ Tables created: User, UserSettings, Analysis, Feedback, UrlCache
- ✅ Prisma client generated in node_modules
- ✅ Connection verified

### 1.3 Enable Row Level Security (Optional but Recommended)

```sql
-- Run in Supabase SQL Editor
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can view own settings" ON "UserSettings"
  FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can view own analysis" ON "Analysis"
  FOR ALL USING (auth.uid()::text = "userId");
```

---

## Phase 2: AWS Infrastructure Setup (20-30 minutes)

### 2.1 AWS Credentials Configuration

```bash
# Install AWS CLI if not already installed
# macOS:
brew install awscli

# Configure AWS credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format: json

# Verify credentials
aws sts get-caller-identity
```

### 2.2 Bootstrap CDK (First Time Only)

```bash
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK in your AWS account
npx cdk bootstrap
```

**Expected outcome:**
- ✅ CDKToolkit CloudFormation stack created
- ✅ S3 bucket for CDK assets created

### 2.3 Create .env for Infrastructure

```bash
cd infrastructure

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
AWS_REGION=us-east-1
ENVIRONMENT=development
EOF
```

### 2.4 Deploy Infrastructure

```bash
cd infrastructure

# Synthesize CloudFormation template (dry run)
npx cdk synth

# Deploy all stacks
npx cdk deploy --all --require-approval never

# Note: This will create:
# - S3 bucket for ML models
# - Lambda functions (analyze, stats, settings, feedback)
# - API Gateway with CORS enabled
# - Cognito User Pool (if not using Supabase Auth)
```

**Expected outcome:**
- ✅ CloudFormation stack created successfully
- ✅ API Gateway URL output (save this)
- ✅ Lambda functions deployed
- ✅ S3 bucket created for ML models

---

## Phase 3: Backend API Implementation (30-40 minutes)

### 3.1 Create Lambda Function Handlers

```bash
cd packages/api

# Install dependencies
npm install

# Create Lambda handlers directory structure
mkdir -p src/handlers
mkdir -p src/utils
mkdir -p src/types
```

### 3.2 Implement Core Lambda Functions

**Priority order:**
1. ✅ `analyze.ts` - URL analysis endpoint (most critical)
2. ✅ `stats.ts` - User statistics endpoint
3. ✅ `settings.ts` - User settings CRUD
4. ✅ `feedback.ts` - User feedback submission

**Implementation checklist per function:**
- [ ] Input validation
- [ ] Authentication check (JWT validation)
- [ ] Database interaction (Prisma)
- [ ] Error handling
- [ ] Response formatting
- [ ] Security headers

### 3.3 Test Lambda Functions Locally

```bash
# Install AWS SAM CLI for local testing
brew install aws-sam-cli

# Test analyze function locally
sam local invoke AnalyzeFunction --event test/events/analyze-event.json

# Test with local API Gateway
sam local start-api
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"url": "https://example.com"}'
```

---

## Phase 4: Authentication Setup (15-20 minutes)

### Option A: Supabase Auth (Recommended for Speed)

```bash
# In Supabase dashboard:
# 1. Go to Authentication → Settings
# 2. Enable email auth
# 3. Configure email templates
# 4. Get project URL and anon key

# Add to .env
echo "SUPABASE_URL=https://[PROJECT_REF].supabase.co" >> .env
echo "SUPABASE_ANON_KEY=[YOUR_ANON_KEY]" >> .env
```

**Modify Lambda functions to use Supabase JWT:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function validateToken(authHeader: string) {
  const token = authHeader?.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}
```

### Option B: AWS Cognito (More AWS-native)

```bash
# In CDK stack, Cognito User Pool already created
# Get User Pool ID and Client ID from CloudFormation outputs

aws cognito-idp list-user-pools --max-results 10

# Add to .env
echo "COGNITO_USER_POOL_ID=[POOL_ID]" >> .env
echo "COGNITO_CLIENT_ID=[CLIENT_ID]" >> .env
```

---

## Phase 5: Dashboard Deployment (10-15 minutes)

### 5.1 Configure Dashboard Environment

```bash
cd packages/dashboard

# Create .env.production
cat > .env.production << EOF
VITE_API_URL=https://[API_GATEWAY_URL].execute-api.us-east-1.amazonaws.com
VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
EOF

# Install dependencies
npm install

# Build for production
npm run build

# Test locally
npm run preview
```

### 5.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from dashboard directory
cd packages/dashboard
vercel

# Follow prompts:
# - Link to existing project? N (create new)
# - Project name: pufferphish-dashboard
# - In which directory is your code? ./
# - Override settings? N

# Deploy to production
vercel --prod
```

**Expected outcome:**
- ✅ Dashboard deployed to Vercel
- ✅ URL: https://pufferphish-dashboard.vercel.app
- ✅ Environment variables configured

### 5.3 Configure Vercel Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - `VITE_API_URL` → Your API Gateway URL
   - `VITE_SUPABASE_URL` → Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key

---

## Phase 6: GitHub Actions Configuration (10 minutes)

### 6.1 Add GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

**Add the following secrets:**

**AWS Secrets:**
- `AWS_ACCESS_KEY_ID` → Your IAM user access key
- `AWS_SECRET_ACCESS_KEY` → Your IAM user secret key
- `AWS_REGION` → us-east-1 (or your region)

**Database Secret:**
- `DATABASE_URL` → Your Supabase connection string

**Vercel Secrets:**
- `VERCEL_TOKEN` → Generate at https://vercel.com/account/tokens
- `VERCEL_ORG_ID` → From `.vercel/project.json`
- `VERCEL_PROJECT_ID` → From `.vercel/project.json`

**API Secrets (for Dashboard build):**
- `API_URL` → Your API Gateway URL
- `SUPABASE_URL` → Your Supabase project URL
- `SUPABASE_ANON_KEY` → Your Supabase anon key

### 6.2 Test CI Workflow

```bash
# Push to billy-dev to trigger CI
git push origin billy-dev

# Check GitHub Actions tab for results
# Expected jobs to pass:
# - Lint & Type Check
# - Security Audit
# - Validate Documentation
```

### 6.3 Test Deploy Workflow

1. Go to GitHub Actions tab
2. Click "Deploy" workflow
3. Click "Run workflow"
4. Select:
   - Component: `dashboard`
   - Environment: `development`
5. Click "Run workflow"
6. Monitor deployment logs

---

## Phase 7: Integration Testing (20-30 minutes)

### 7.1 Manual API Testing

```bash
# Get API Gateway URL from CDK output or AWS Console
export API_URL="https://[API_ID].execute-api.us-east-1.amazonaws.com"

# Test analyze endpoint (requires auth token)
curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -d '{
    "url": "https://suspicious-site.com",
    "metadata": {
      "userAgent": "Mozilla/5.0"
    }
  }'

# Expected response:
# {
#   "id": "...",
#   "url": "https://suspicious-site.com",
#   "riskScore": 0.85,
#   "isPhishing": true,
#   "analysis": {...}
# }
```

### 7.2 Dashboard Testing

1. Open dashboard URL in browser
2. Sign up with test account
3. Verify:
   - [ ] Sign up flow works
   - [ ] Login works
   - [ ] Dashboard loads without errors
   - [ ] Settings page accessible
   - [ ] Stats page shows empty state

### 7.3 End-to-End Flow Test

**Simulated Extension → Backend → ML → Response flow:**

```bash
# 1. Create user via dashboard signup
# 2. Get auth token from Supabase/Cognito
# 3. Test URL analysis
# 4. Verify result stored in database
# 5. Check stats endpoint shows analysis

# Full test script:
export TOKEN="[YOUR_AUTH_TOKEN]"
export API_URL="https://[API_ID].execute-api.us-east-1.amazonaws.com"

# Submit analysis
curl -X POST $API_URL/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://test-phishing.com"}' \
  -o analysis.json

# Check stats
curl -X GET $API_URL/stats \
  -H "Authorization: Bearer $TOKEN"

# Submit feedback
curl -X POST $API_URL/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "[ID_FROM_ANALYSIS]",
    "isAccurate": true,
    "comment": "Test feedback"
  }'
```

---

## Phase 8: Validation & Documentation (15 minutes)

### 8.1 MVP Success Criteria Checklist

**Functional Requirements:**
- [ ] API responds to URL analysis requests
- [ ] Database stores analysis results
- [ ] Dashboard displays user interface
- [ ] Authentication works (signup/login)
- [ ] Settings can be saved and retrieved

**Technical Requirements:**
- [ ] All API endpoints operational (analyze, stats, settings, feedback)
- [ ] Database schema deployed successfully
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured for extension/dashboard access

**Performance Requirements:**
- [ ] API latency <500ms (test with curl timing)
- [ ] Database queries <100ms (check CloudWatch)
- [ ] Dashboard load time <2s (test with browser DevTools)

**Security Requirements:**
- [ ] JWT validation working
- [ ] HTTPS only
- [ ] Environment variables secure (not in code)
- [ ] Database credentials not exposed

### 8.2 Document Deployment Outputs

Create `deployment-info.md` with:

```markdown
# PufferPhish Deployment Information

**Deployment Date:** [DATE]
**Environment:** Development

## Endpoints
- API Gateway: https://[API_ID].execute-api.us-east-1.amazonaws.com
- Dashboard: https://pufferphish-dashboard.vercel.app
- Database: [PROJECT_REF].supabase.co

## AWS Resources
- Lambda Functions:
  - pufferphish-analyze
  - pufferphish-stats
  - pufferphish-settings
  - pufferphish-feedback
- S3 Bucket: pufferphish-ml-models-[ID]
- CloudFormation Stack: PufferPhishStack

## Authentication
- Provider: Supabase Auth (or Cognito)
- User Pool: [POOL_ID if Cognito]

## Next Steps
1. Share API URL with extension team
2. Share integration specs with ML team
3. Test with real phishing URLs
4. Monitor CloudWatch logs for errors
```

### 8.3 Update Team Documentation

```bash
# Create integration handoff document
cat > docs/integration-handoff.md << EOF
# Integration Handoff

## For Extension Team
- API Gateway URL: [YOUR_URL]
- Authentication: JWT Bearer tokens
- See: docs/02-extension-integration.md for API contract

## For ML Team
- Lambda function name: pufferphish-ml-analyze
- S3 bucket: pufferphish-ml-models-[ID]
- See: docs/01-ml-integration.md for interface contract

## Testing
- Test credentials: [email/password]
- Dashboard URL: [Vercel URL]
- API documentation: docs/api-reference.md
EOF

git add docs/integration-handoff.md
git commit -m "Add integration handoff documentation"
```

---

## Troubleshooting Common Issues

### Issue: CDK Deploy Fails

**Symptom:** `Error: Stack creation failed`

**Solutions:**
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify CDK is bootstrapped: `npx cdk bootstrap`
3. Check CloudFormation console for detailed error
4. Verify environment variables in .env

### Issue: Database Connection Failed

**Symptom:** `PrismaClientInitializationError`

**Solutions:**
1. Verify DATABASE_URL format is correct
2. Check Supabase project is running (not paused)
3. Test connection: `npx prisma db pull`
4. Verify firewall/network access to Supabase

### Issue: Lambda Function Timeout

**Symptom:** `Task timed out after 3.00 seconds`

**Solutions:**
1. Increase Lambda timeout in CDK stack (30s recommended)
2. Optimize database queries
3. Add connection pooling
4. Check CloudWatch logs for bottlenecks

### Issue: CORS Errors in Dashboard

**Symptom:** `Access-Control-Allow-Origin error`

**Solutions:**
1. Verify API Gateway CORS configuration in CDK
2. Add CORS headers to Lambda responses
3. Check dashboard is using correct API URL
4. Verify OPTIONS preflight requests work

### Issue: Vercel Deployment Fails

**Symptom:** `Build failed`

**Solutions:**
1. Check environment variables are set in Vercel
2. Verify build command in package.json
3. Test build locally: `npm run build`
4. Check Vercel deployment logs for specific error

---

## Success Metrics

After completing all phases, you should have:

✅ **Infrastructure:**
- Supabase database with 5 tables
- 4 Lambda functions deployed
- API Gateway with 4 endpoints
- S3 bucket for ML models
- Dashboard on Vercel

✅ **Functionality:**
- Users can sign up/login
- API accepts URL analysis requests
- Database stores results
- Dashboard displays UI

✅ **Cost:**
- Estimated monthly: $10-20
- Supabase: Free tier
- Lambda: ~$1-5 (low traffic)
- API Gateway: ~$1-3
- Vercel: Free tier
- S3: ~$0.50

✅ **Timeline:**
- Total setup time: 2-3 hours
- Ready for integration testing with extension/ML teams

---

## Next Steps After MVP

1. **Integration:** Coordinate with extension and ML teams for end-to-end testing
2. **Monitoring:** Set up CloudWatch dashboards and alarms
3. **Optimization:** Add caching layer (Redis) if needed
4. **Security:** Security audit and penetration testing
5. **Scale:** Load testing and auto-scaling configuration

**Ready to begin implementation!**
