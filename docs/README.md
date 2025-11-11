# PufferPhish Documentation

## Project Overview

**Mission:** Build a proactive, ML-powered phishing detection system that protects users across all touchpoints while educating them about security threats.

**Core Features:**

- Browser extension with on-click URL scanning
- Web dashboard for statistics and settings
- Pretrained ML model for intelligent detection
- User accounts with abuse prevention
- Real-time threat intelligence integration

## Documentation Structure

| Document                             | Description                                             |
| -------------------------------------|---------------------------------------------------------|
| [Architecture](./architecture.md)    | System design, tech stack, and component interactions   |
| [Team Roles](./team-roles.md)        | Role definitions and responsibilities for 4-person team |
| [Timeline](./timeline.md)            | Concurrent development schedule across 16 weeks         |
| [Setup Guide](./setup-guide.md)      | Development environment and quick start instructions    |
| [Infrastructure](./infrastructure.md)| AWS CDK setup, cost management, and deployment          |
| [Database Schema](./database.md)     | PostgreSQL schema and data models                       |
| [Security](./security.md)            | Security considerations and best practices              |
| [API Reference](./api-reference.md)  | API endpoints and integration guide                     |

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourteam/pufferphish.git
cd pufferphish

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your AWS credentials

# 4. Start local services
docker-compose up -d  # PostgreSQL
npm run dev          # Start all packages

# 5. First-time infrastructure deployment
cd infrastructure
npm run cdk bootstrap
npm run cdk deploy --all
```

## Repository Structure

```
pufferphish/
├── docs/               # Project documentation
├── packages/           # Monorepo packages
│   ├── extension/     # Chrome extension
│   ├── dashboard/     # React dashboard
│   ├── api/          # Lambda functions
│   ├── ml-engine/    # ML integration
│   ├── shared/       # Shared types
│   └── database/     # Prisma schema
├── infrastructure/    # AWS CDK
├── scripts/          # Dev scripts
└── docker-compose.yml # Local services
```

## Success Criteria

### MVP Requirements (End of Semester)

- Extension detects phishing with >80% accuracy
- Dashboard shows user statistics
- <500ms API response time
- Support 100 concurrent users
- Stay under $20/month costs
- Pass Chrome Web Store review

## Support

- **Technical Issues:** Create GitHub issue
- **Documentation Updates:** Submit PR to `docs/`

---

**Version:** 1.0 | **Last Updated:** September 3, 2025
