# Team Roles & Responsibilities

## Role Distribution (4 People)

### Role 1: Security Engineer (Browser Extension)

**Primary Ownership:** `/packages/extension/`

**Core Responsibilities:**
- Chrome extension architecture (Manifest V3)
- Service worker implementation (background script)
- Content script injection and page interaction
- Popup UI development
- Extension-to-API secure communication
- Chrome Web Store submission and updates

**Technical Skills Required:**
- JavaScript/TypeScript
- Chrome Extension APIs
- Web security best practices
- HTML/CSS for popup UI

**Key Deliverables:**
- Week 3-4: Basic extension with URL extraction
- Week 7-8: Full popup UI with settings
- Week 11-12: Chrome Web Store ready package
- Week 15: Production release

---

### Role 2: AWS Backend Engineer

**Primary Ownership:** `/packages/api/`, `/infrastructure/lambda/`

**Core Responsibilities:**
- Lambda function development
- API Gateway configuration
- Database query optimization (Prisma)
- External API integrations
- Response caching implementation
- Performance monitoring

**Technical Skills Required:**
- Node.js/TypeScript
- AWS Lambda
- PostgreSQL
- REST API design
- Prisma ORM

**Key Deliverables:**
- Week 2: Basic Lambda setup
- Week 5-6: All API endpoints functional
- Week 9-10: External API integration
- Week 13-14: Performance optimization

---

### Role 3: ML Engineer

**Primary Ownership:** `/packages/ml-engine/`

**Core Responsibilities:**
- Pretrained model selection and evaluation
- Model deployment to Lambda
- Inference optimization
- Fallback rule engine
- Model versioning in S3
- Accuracy monitoring and feedback loop

**Technical Skills Required:**
- Python/TypeScript
- Hugging Face Transformers
- AWS S3
- ML model optimization
- Data analysis

**Key Deliverables:**
- Week 1-2: Model research and selection
- Week 9-10: Lambda inference implementation
- Week 11-12: Rule-based fallback system
- Week 13-14: Feedback integration

---

### Role 4: Full-Stack/Infrastructure Lead

**Primary Ownership:** `/packages/dashboard/`, `/infrastructure/`

**Core Responsibilities:**
- React dashboard development
- AWS CDK infrastructure as code
- CI/CD pipeline (GitHub Actions)
- Development environment setup
- Cost monitoring and optimization
- Team coordination

**Technical Skills Required:**
- React/TypeScript
- AWS CDK
- GitHub Actions
- Docker
- Project management

**Key Deliverables:**
- Week 1-2: Infrastructure setup
- Week 7-8: Dashboard implementation
- Week 3-4: CI/CD pipeline
- Ongoing: Cost monitoring

---

## Collaboration Points

### Weekly Sync Points

**Extension ↔ API (Roles 1 & 2)**
- API contract definition
- Authentication flow
- Error handling

**API ↔ ML (Roles 2 & 3)**
- Model inference endpoint
- Response format
- Performance requirements

**Dashboard ↔ API (Roles 4 & 2)**
- User management endpoints
- Statistics aggregation
- Settings management

**Infrastructure ↔ All (Role 4 coordinates)**
- Environment variables
- Deployment process
- Resource access

## Communication Protocol

### Code Review Process
1. Create feature branch from `develop`
2. Open PR with clear description
3. Tag relevant team member for review
4. Require 1 approval before merge
5. Merge to `develop` after approval
6. Weekly release from `develop` to `main`

## Ownership Matrix

| Component | Primary | Secondary |
|-----------|---------|-----------|
| Extension Manifest | Role 1 | - |
| Service Worker | Role 1 | Role 2 |
| Popup UI | Role 1 | Role 4 |
| Lambda Functions | Role 2 | Role 3 |
| API Gateway | Role 2 | Role 4 |
| Database Schema | Role 2 | Role 4 |
| ML Model | Role 3 | - |
| Inference Logic | Role 3 | Role 2 |
| React Dashboard | Role 4 | - |
| CDK Infrastructure | Role 4 | Role 2 |
| CI/CD Pipeline | Role 4 | - |
| Documentation | All | Role 4 leads |

## Escalation Path

1. **Technical Blocker:** Post in Slack, tag relevant owner
2. **Integration Issue:** Schedule pair programming session
3. **Major Decision:** Team vote in weekly meeting
4. **External Dependency:** Role 4 coordinates resolution
5. **Scope Change:** Full team discussion required

## Knowledge Sharing

### Documentation Requirements
- Each role maintains README in their package
- API changes require updated OpenAPI spec
- Infrastructure changes need CDK comments
- Complex logic needs inline documentation

### Cross-Training Sessions
- Week 4: Extension architecture (Role 1 leads)
- Week 6: AWS services overview (Role 2 leads)
- Week 10: ML model basics (Role 3 leads)
- Week 8: React patterns (Role 4 leads)