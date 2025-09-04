# Development Setup Guide

## Prerequisites

### Required Software

- Node.js 18+ and npm 9+
- Docker Desktop
- AWS CLI v2
- Chrome or Chromium browser
- Git

### AWS Account Setup

1. Create AWS account (or use existing)
2. Create IAM user with programmatic access
3. Attach `PowerUserAccess` policy (for development)
4. Save access key ID and secret access key

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourteam/pufferphish.git
cd pufferphish
```

### 2. Install Dependencies

```bash
# Install npm packages for all workspaces
npm install

# Install global tools
npm install -g aws-cdk turborepo
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
# AWS_ACCOUNT_ID=your-account-id
# AWS_REGION=us-east-1
# COGNITO_USER_POOL_ID=will-be-set-after-deploy
# DATABASE_URL=postgresql://user:pass@localhost:5432/pufferphish
```

### 4. Local Services Setup

#### PostgreSQL via Docker

```bash
# Start PostgreSQL
docker-compose up -d

# Verify it's running
docker ps

# Database will be available at localhost:5432
# Default credentials in docker-compose.yml
```

#### LocalStack (Optional - for AWS emulation)

```bash
# Install LocalStack
pip install localstack

# Start LocalStack
localstack start

# Services available at localhost:4566
```

### 5. Database Setup

```bash
# Generate Prisma client
cd packages/database
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data (optional)
npx prisma db seed
```

### 6. AWS Infrastructure Deployment

#### First Time Setup

```bash
cd infrastructure

# Bootstrap CDK (one time only)
npm run cdk bootstrap

# Deploy all stacks
npm run cdk deploy --all

# Save outputs (Cognito ID, API URL, etc.)
```

#### Update .env with deployed values

```bash
# Add these from CDK outputs:
COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
API_GATEWAY_URL=https://xxxxxx.execute-api.us-east-1.amazonaws.com
CLOUDFRONT_URL=https://xxxxxx.cloudfront.net
```

## Development Workflow

### Starting Development Servers

#### All Services (Recommended)

```bash
# From root directory
npm run dev

# This starts:
# - Extension dev server (localhost:3001)
# - Dashboard dev server (localhost:3000)
# - API watch mode
# - Database studio (localhost:5555)
```

#### Individual Services

```bash
# Extension only
npm run dev:extension

# Dashboard only
npm run dev:dashboard

# API only
npm run dev:api

# Database studio
npm run db:studio
```

### Extension Development

#### Loading Extension in Chrome

1. Open Chrome
2. Navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `packages/extension/dist` folder
6. Extension will appear in toolbar

#### Hot Reload Setup

```bash
# Extension watches for changes
npm run dev:extension

# Manually reload in Chrome after changes
# Or use Extensions Reloader extension
```

### API Development

#### Testing Endpoints Locally

```bash
# Use included REST client
cd packages/api
npm run test:api

# Or use curl
curl -X POST http://localhost:3002/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "http://example.com"}'
```

#### Debugging Lambda Functions

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Lambda",
      "program": "${workspaceFolder}/packages/api/src/handlers/analyze.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Dashboard Development

#### Component Development

```bash
# Start Storybook for component development
cd packages/dashboard
npm run storybook

# Opens at localhost:6006
```

#### API Mocking

```javascript
// packages/dashboard/src/mocks/handlers.ts
export const handlers = [
  rest.post("/api/analyze", (req, res, ctx) => {
    return res(
      ctx.json({
        riskScore: 0.75,
        threats: ["phishing"],
      }),
    );
  }),
];
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for specific package
npm run test --workspace=packages/api
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Requires local services running
docker-compose up -d
npm run dev:api
```

### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Runs in headless Chrome
# Tests full user flows
```

## Common Tasks

### Adding Dependencies

```bash
# Add to specific workspace
npm install package-name --workspace=packages/api

# Add to root
npm install package-name

# Add dev dependency
npm install --save-dev package-name
```

### Database Migrations

```bash
cd packages/database

# Create migration
npx prisma migrate dev --name add_user_field

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/extension

# Output in packages/*/dist
```

### Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production (requires approval)
npm run deploy:prod

# Deploy specific stack
cd infrastructure
npm run cdk deploy ApiStack
```

## Troubleshooting

### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change ports in package.json
```

### Database Connection Issues

```bash
# Check Docker is running
docker ps

# Restart database
docker-compose restart

# Check connection string
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

### Extension Not Loading

1. Check for errors in `chrome://extensions`
2. Check manifest.json syntax
3. Ensure dist folder exists
4. Check console for errors (right-click extension icon → Inspect)

### AWS Credentials Issues

```bash
# Verify credentials
aws sts get-caller-identity

# Configure credentials
aws configure

# Use specific profile
export AWS_PROFILE=pufferphish-dev
```

### Build Failures

```bash
# Clear all caches
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear build artifacts
npm run clean:build
```

## IDE Setup

### VS Code Extensions

- ESLint
- Prettier
- Prisma
- AWS Toolkit
- Chrome Extension Developer Tools

### Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Resources

### Documentation

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [AWS CDK Guide](https://docs.aws.amazon.com/cdk/v2/guide/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)
