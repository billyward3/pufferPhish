# PufferPhish Documentation

**Mission:** Build a proactive, ML-powered phishing detection system that protects users across all touchpoints while educating them about security threats.

**Objective:** Rapid MVP deployment with three parallel development tracks

---

## Project Overview

PufferPhish is a browser extension that uses machine learning to detect and block phishing attempts in real-time. The system consists of three main components working together to provide seamless protection.

### Core Features

- **Real-Time Detection:** Analyze URLs as users browse
- **ML-Powered:** Pretrained model provides intelligent threat assessment
- **Progressive Warnings:** Tiered warning system based on risk level
- **User Dashboard:** Statistics, settings, and history
- **Feedback Loop:** Users can report false positives to improve accuracy
- **Whitelist Management:** Trust your frequently visited domains

---

## Architecture Overview

```
┌─────────────────┐
│ Chrome Extension│ ← User interaction, URL monitoring
└────────┬────────┘
         │ HTTPS/JWT
         ▼
┌─────────────────┐
│  API Gateway    │ ← REST API endpoints
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lambda Functions│ ← Business logic, orchestration
└────────┬────────┘
         │
    ┌────┴────┬───────────┬─────────┐
    ▼         ▼           ▼         ▼
┌────────┐ ┌──────┐ ┌─────────┐ ┌────────┐
│ML Model│ │ Auth │ │Database │ │  S3    │
│Lambda  │ │Cognito│ │Postgres │ │Models  │
└────────┘ └──────┘ └─────────┘ └────────┘

┌─────────────────┐
│ React Dashboard │ ← User statistics & settings
└─────────────────┘
```

---

## Documentation Structure

### Implementation Guides

| Document | Description | Owner |
|----------|-------------|-------|
| [01-ml-integration.md](./01-ml-integration.md) | ML model & Lambda integration specs | ML Team |
| [02-extension-integration.md](./02-extension-integration.md) | Browser extension integration specs | Extension Team |
| [03-backend-implementation.md](./03-backend-implementation.md) | Backend API & infrastructure guide | **Backend Team (You)** |

### Security Documentation

| Document | Description |
|----------|-------------|
| [security/01-ml-security.md](./security/01-ml-security.md) | ML component security guidelines |
| [security/02-extension-security.md](./security/02-extension-security.md) | Browser extension security |
| [security/03-backend-security.md](./security/03-backend-security.md) | Backend & infrastructure security |

### Additional Resources

| Document | Description |
|----------|-------------|
| [team-structure.md](./team-structure.md) | Team organization & responsibilities |
| [architecture.md](./architecture.md) | Technical architecture details |
| [setup-guide.md](./setup-guide.md) | Development environment setup |
| [api-reference.md](./api-reference.md) | API endpoints documentation |
| [database.md](./database.md) | Database schema & queries |
| [infrastructure.md](./infrastructure.md) | AWS infrastructure details |

---

## Quick Start

### For Backend Team (Primary Focus)

```bash
# 1. Clone repository
git clone https://github.com/yourteam/pufferphish.git
cd pufferphish

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 4. Set up database (Supabase recommended)
cd packages/database
npx prisma db push
npx prisma generate

# 5. Deploy infrastructure
cd infrastructure
npm run cdk bootstrap  # First time only
npm run cdk deploy
```

**Next Steps:**
1. Read [03-backend-implementation.md](./03-backend-implementation.md) for detailed guide
2. Review [api-reference.md](./api-reference.md) for endpoint specifications
3. Check [security/03-backend-security.md](./security/03-backend-security.md) for security requirements

### For ML Team

```bash
# 1. Set up ML development environment
cd packages/ml-engine
pip install -r requirements.txt

# 2. Download and test model
python scripts/download_model.py
python scripts/test_inference.py

# 3. Deploy to Lambda
npm run build
cd infrastructure
npm run cdk deploy MlStack
```

**Next Steps:**
1. Read [01-ml-integration.md](./01-ml-integration.md) for integration specs
2. Review [security/01-ml-security.md](./security/01-ml-security.md) for security requirements

### For Extension Team

```bash
# 1. Build extension
cd packages/extension
npm install
npm run build

# 2. Load in Chrome
# - Open chrome://extensions
# - Enable Developer mode
# - Click "Load unpacked"
# - Select packages/extension/dist

# 3. Configure API endpoint
# Edit packages/extension/src/config.ts with API URL
```

**Next Steps:**
1. Read [02-extension-integration.md](./02-extension-integration.md) for integration specs
2. Review [security/02-extension-security.md](./security/02-extension-security.md) for security requirements

---

## Component Breakdown

### 1. ML Detection Engine

**Technology:** Python, Hugging Face Transformers, AWS Lambda
**Responsibilities:**
- Load pretrained phishing detection model
- Analyze URLs for threat indicators
- Return risk scores (0.0 to 1.0)
- Provide fallback rule-based detection

**Key Files:**
- `/packages/ml-engine/` - ML inference code
- `/models/` - Model storage on S3

### 2. Browser Extension

**Technology:** TypeScript, Chrome Extension API (Manifest V3)
**Responsibilities:**
- Monitor user navigation
- Send URLs to backend for analysis
- Display warnings based on risk level
- Sync settings and statistics with dashboard

**Key Files:**
- `/packages/extension/` - Extension source code
- `manifest.json` - Extension configuration
- `background.js` - Service worker
- `content.js` - Page injection

### 3. Backend API

**Technology:** Node.js, TypeScript, AWS Lambda, API Gateway
**Responsibilities:**
- Orchestrate URL analysis (call ML Lambda)
- Manage user authentication
- Store analysis results and feedback
- Provide statistics and settings APIs

**Key Files:**
- `/packages/api/` - Lambda function handlers
- `/packages/database/` - Prisma schema
- `/infrastructure/` - AWS CDK

### 4. Web Dashboard

**Technology:** React, TypeScript, Vite, Vercel
**Responsibilities:**
- User authentication (sign up/in)
- Display statistics and history
- Manage settings and whitelist
- Extension download/setup instructions

**Key Files:**
- `/packages/dashboard/` - React application

### 5. Database

**Technology:** PostgreSQL (Supabase or RDS)
**Responsibilities:**
- Store user accounts and settings
- Store analysis history
- Cache URL results for performance
- Store user feedback

**Schema:**
- `User` - User accounts
- `UserSettings` - Preferences and whitelist
- `Analysis` - URL analysis results
- `Feedback` - User-reported accuracy
- `UrlCache` - 24-hour result cache

### 6. Infrastructure

**Technology:** AWS CDK (TypeScript), Supabase
**Responsibilities:**
- Deploy Lambda functions
- Configure API Gateway
- Set up authentication (Cognito)
- Manage S3 buckets
- Configure monitoring

**Stacks:**
- API Stack - Lambda + API Gateway
- Auth Stack - Cognito User Pool
- ML Stack - ML Lambda + S3

---

## Integration Points

### Extension → Backend API

**Protocol:** HTTPS REST API
**Authentication:** JWT Bearer token
**Endpoints Used:**
- `POST /analyze` - Analyze URL
- `GET /stats` - Get statistics
- `GET /settings` - Get preferences
- `PUT /settings` - Update preferences
- `POST /feedback` - Submit feedback

### Backend → ML Lambda

**Protocol:** Lambda invocation (AWS SDK)
**Input:**
```json
{
  "url": "https://example.com",
  "domain": "example.com",
  "metadata": { ... }
}
```

**Output:**
```json
{
  "riskScore": 0.85,
  "threats": { "phishing": 0.85, "malware": 0.10, "social": 0.45 },
  "confidence": 0.92,
  "source": "ml",
  "modelVersion": "v1.0.0"
}
```

### Dashboard → Backend API

**Protocol:** HTTPS REST API
**Authentication:** Cognito/Supabase hosted UI
**Features:**
- User authentication
- Statistics visualization
- Settings management
- Analysis history

---

## MVP Success Criteria

### Functional Requirements
- ✅ Extension detects phishing with >80% accuracy
- ✅ API response time <500ms (p95)
- ✅ Dashboard displays user statistics correctly
- ✅ Users can customize settings and whitelist
- ✅ Warning system works across all risk levels
- ✅ Feedback submission functional

### Technical Requirements
- ✅ All API endpoints operational
- ✅ Database schema deployed
- ✅ ML Lambda integrated
- ✅ Extension passes Chrome Web Store review
- ✅ HTTPS enforced everywhere
- ✅ Authentication secure (JWT)

### Performance Requirements
- ✅ API latency <500ms
- ✅ ML inference <500ms
- ✅ Database queries <100ms
- ✅ Dashboard load time <2s

### Cost Requirements
- ✅ Monthly costs <$20 (MVP phase)
- ✅ Scalable to 100-1000 users
- ✅ No unnecessary services

---

## Deployment Strategy

### Recommended: Hybrid Approach

**Database:** Supabase (free tier, managed Postgres)
- Fast setup (< 10 minutes)
- Built-in auth option
- Auto-backups included
- Can migrate to RDS later

**API:** AWS Lambda + API Gateway
- Pay per request
- Auto-scaling built-in
- Easy deployment with CDK

**ML:** Lambda (Python) + S3
- Store model in S3
- Lambda loads on cold start
- 512MB-3GB memory

**Dashboard:** Vercel (free tier)
- Auto-deploy from git
- Global CDN included
- Free SSL certificate

**Auth:** Supabase Auth OR AWS Cognito
- Supabase: Simpler, faster setup
- Cognito: More AWS-native

**Total Setup Time:** 2-3 hours
**Monthly Cost:** $10-20

---

## Testing Strategy

### Unit Tests
- ML: Model inference correctness
- API: Endpoint logic, database queries
- Extension: Component behavior

### Integration Tests
- Backend invokes ML Lambda correctly
- Extension authenticates and calls API
- Database operations work end-to-end

### End-to-End Tests
```
User flow:
1. Install extension
2. Sign up via dashboard
3. Visit suspicious URL
4. Extension analyzes via API
5. API calls ML Lambda
6. Warning displays
7. User submits feedback
8. Dashboard shows statistics
```

---

## Security Highlights

### Authentication
- JWT tokens for API access
- Secure token storage in extension
- Token expiration and refresh
- HTTPS-only communication

### Data Protection
- No sensitive data in logs
- Database connection via SSL
- Encrypted data at rest (S3, RDS)
- Input validation on all endpoints

### Infrastructure
- IAM roles follow least privilege
- Secrets in AWS Secrets Manager
- API Gateway throttling enabled
- CloudWatch monitoring configured

**For detailed security guidelines, see:**
- [security/01-ml-security.md](./security/01-ml-security.md)
- [security/02-extension-security.md](./security/02-extension-security.md)
- [security/03-backend-security.md](./security/03-backend-security.md)

---

## Repository Structure

```
pufferphish/
├── docs/                          # This directory
│   ├── 01-ml-integration.md      # ML integration specs
│   ├── 02-extension-integration.md # Extension integration specs
│   ├── 03-backend-implementation.md # Backend implementation guide
│   ├── security/                 # Security documentation
│   ├── team-structure.md         # Team organization
│   ├── architecture.md           # Technical architecture
│   ├── api-reference.md          # API documentation
│   ├── database.md               # Database schema
│   └── ...
├── packages/
│   ├── extension/                # Chrome extension
│   ├── dashboard/                # React dashboard
│   ├── api/                      # Lambda functions
│   ├── ml-engine/                # ML inference
│   ├── database/                 # Prisma schema
│   └── shared/                   # Shared types
├── infrastructure/               # AWS CDK
├── scripts/                      # Utility scripts
└── docker-compose.yml           # Local development
```

---

## Support & Troubleshooting

### Common Issues

**Database Connection Failed:**
- Check connection string in .env
- Verify database is running (Docker or Supabase)
- Test with: `npx prisma db pull`

**Extension Won't Load:**
- Check `manifest.json` syntax
- Ensure `dist/` folder exists (run `npm run build`)
- Check Chrome console for errors

**API Gateway Returns 403:**
- Verify CORS configuration
- Check authorization header format
- Validate JWT token is not expired

**ML Lambda Timeout:**
- Increase Lambda timeout (30s recommended)
- Check model file is in S3
- Verify Lambda has S3 read permissions

### Getting Help

**Technical Issues:**
- Check relevant implementation guide
- Review security documentation
- Search GitHub issues

**Integration Problems:**
- Backend team coordinates integration testing
- Review API contract in integration guides
- Check example requests/responses

---

## Next Steps After MVP

Once MVP is working and deployed:

### Performance Optimization
- Add caching layer (Redis/ElastiCache)
- Optimize database queries (indexes)
- Implement connection pooling
- Add CDN for dashboard

### Feature Enhancements
- External API integration (Google Safe Browsing, PhishTank)
- Bulk URL scanning
- Browser history analysis
- Mobile app support

### Monitoring & Operations
- Comprehensive CloudWatch dashboards
- Error tracking (Sentry)
- User analytics
- Cost optimization

### Scale Preparation
- Multi-region deployment
- Database replication
- Auto-scaling configuration
- Load testing

---

## Version History

**Version:** 2.0 - Reorganized for rapid deployment
**Last Updated:** November 11, 2024
**Changes:**
- Restructured into 3-part component division
- Removed timeline references (flexible completion)
- Added rapid deployment strategies
- Split security documentation by component
- Streamlined infrastructure recommendations

---

## License & Contact

**License:** [To be determined]
**Repository:** https://github.com/yourteam/pufferphish
**Issues:** https://github.com/yourteam/pufferphish/issues
**Documentation:** https://docs.pufferphish.com (this directory)
