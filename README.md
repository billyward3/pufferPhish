# PufferPhish - ML-Powered Phishing Detection System

## Overview

PufferPhish is a proactive, ML-powered phishing detection system that protects users across all touchpoints while educating them about security threats.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourteam/pufferphish.git
cd pufferphish

# 2. Run setup script (or follow manual steps below)
./scripts/setup.sh

# 3. Update environment variables
cp .env.example .env  # If not done by setup script
# Edit .env with your AWS credentials

# 4. Start local services
docker-compose up -d  # PostgreSQL

# 5. Start development
npm run dev          # Start all packages
```

### Manual Setup (if not using setup script)

```bash
# Install dependencies
npm install

# Setup database
cd packages/database
npx prisma generate
npx prisma db push
cd ../..

# First-time AWS deployment (optional)
cd infrastructure
npm run cdk bootstrap
npm run cdk deploy --all
```

## Project Structure

```
pufferphish/
├── docs/                 # Project documentation
├── packages/            # Monorepo packages
│   ├── extension/       # Chrome extension
│   ├── dashboard/       # React dashboard  
│   ├── api/            # Lambda functions
│   ├── ml-engine/      # ML integration
│   ├── shared/         # Shared types & utils
│   └── database/       # Prisma schema
├── infrastructure/      # AWS CDK
├── scripts/            # Development scripts
├── .github/            # CI/CD workflows
└── docker-compose.yml  # Local services
```

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- [Architecture](./docs/architecture.md) - System design and components
- [Team Roles](./docs/team-roles.md) - Role assignments for 4-person team
- [Timeline](./docs/timeline.md) - 16-week implementation schedule
- [Setup Guide](./docs/setup-guide.md) - Detailed setup instructions
- [Infrastructure](./docs/infrastructure.md) - AWS CDK and deployment
- [Database Schema](./docs/database.md) - Data models
- [Security](./docs/security.md) - Security best practices
- [API Reference](./docs/api-reference.md) - API documentation

## Team Roles

1. **Security** - Browser extension development
2. **AWS Backend** - Lambda functions & API
3. **ML** - Model integration & optimization
4. **Full-Stack/Infrastructure Lead** - Dashboard & CDK

## Development Commands

```bash
# Development
npm run dev              # Start all services
npm run dev:extension    # Extension only
npm run dev:dashboard    # Dashboard only
npm run dev:api         # API only

# Testing
npm test                # Run all tests
npm run test:e2e        # End-to-end tests

# Database
npm run db:studio       # Open Prisma Studio
npm run db:push         # Push schema changes

# Deployment
npm run deploy:dev      # Deploy to development
npm run deploy:prod     # Deploy to production
```

## Tech Stack

- **Frontend**: TypeScript, React (Vite), Chrome Extension API
- **Backend**: AWS Lambda, API Gateway HTTP, Node.js
- **Database**: PostgreSQL (RDS)
- **ML**: Pretrained Hugging Face models
- **Infrastructure**: AWS CDK
- **Auth**: AWS Cognito

## Contributing

1. Create feature branch from `develop`
2. Make changes following existing patterns
3. Submit PR with description
4. Require 1 approval before merge

## License

Private project - All rights reserved

## Support

- **Technical Issues**: Create GitHub issue
- **Documentation**: See `docs/` folder