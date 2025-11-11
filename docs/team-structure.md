# Team Structure & Responsibilities

**Project:** PufferPhish - ML-Powered Phishing Detection System
**Objective:** Rapid MVP deployment with three parallel development tracks

## Team Organization

The project is divided into three independent but integrated components, each with clear ownership and defined integration points.

```
┌─────────────────────┐
│   ML Component      │  ← ML Team Member
│   (Model & Lambda)  │
└──────────┬──────────┘
           │
           │ Integration: Lambda invocation
           │              JSON response format
           ▼
┌─────────────────────┐
│  Backend Component  │  ← Backend Team (You)
│  (API, DB, Infra)   │
└──────────┬──────────┘
           │
           │ Integration: REST API endpoints
           │              JWT authentication
           ▼
┌─────────────────────┐
│ Extension Component │  ← Extension Team Member
│ (Browser Extension) │
└─────────────────────┘
```

---

## Component 1: ML Model & Integration

**Owner:** ML Team Member
**Primary Deliverables:**
- Pretrained model selection and optimization
- Lambda inference function
- S3 model storage setup
- Fallback rule-based detection

### Core Responsibilities

#### Model Development
- Research and evaluate pretrained phishing detection models
- Optimize model for Lambda deployment (<250MB, <500ms inference)
- Test model accuracy against benchmark dataset
- Document model performance metrics

#### Lambda Implementation
- Create Python Lambda function for inference
- Implement model loading from S3
- Handle inference requests with timeout protection
- Return structured risk assessment

#### Fallback System
- Implement rule-based detection for ML failures
- Define suspicious URL patterns
- Create confidence scoring system
- Test fallback accuracy

### Integration Contract

**Input from Backend:**
```typescript
{
  url: string;
  domain: string;
  metadata?: {
    referrer?: string;
    userAgent?: string;
  }
}
```

**Output to Backend:**
```typescript
{
  riskScore: number;        // 0.0 to 1.0
  threats: {
    phishing: number;
    malware: number;
    social: number;
  };
  confidence: number;       // Model confidence
  source: string;          // "ml" | "rule_based" | "fallback"
  modelVersion: string;
  processingTime: number;
}
```

### Deliverables
- [ ] Model uploaded to S3
- [ ] Lambda function deployed
- [ ] Inference latency <500ms (p95)
- [ ] Accuracy >80% on test set
- [ ] Fallback rules implemented
- [ ] Integration tests passing

### Documentation Requirements
- Model selection justification
- Performance benchmarks
- API contract specification
- Deployment instructions

---

## Component 2: Browser Extension

**Owner:** Extension Team Member
**Primary Deliverables:**
- Chrome Manifest V3 extension
- URL analysis via backend API
- Warning overlay system
- User settings & statistics

### Core Responsibilities

#### Extension Architecture
- Service worker for background processing
- Content scripts for page injection
- Popup UI for statistics and settings
- Chrome storage for auth tokens

#### User Interaction
- Click-based URL scanning
- Automatic navigation monitoring
- Progressive warning system (banner → panel → interstitial)
- Feedback submission

#### Chrome Web Store
- Extension packaging
- Privacy policy documentation
- Screenshots and promotional materials
- Submission and approval process

### Integration Contract

**Authentication:**
- Receives JWT token from backend
- Includes token in all API requests: `Authorization: Bearer <token>`
- Handles token expiration and refresh

**API Endpoints Used:**
- `POST /analyze` - Analyze URL for threats
- `GET /stats` - Fetch user statistics
- `GET /settings` - Get user preferences
- `PUT /settings` - Update preferences
- `POST /feedback` - Submit user feedback

**Expected Response Format:**
```typescript
{
  analysisId: string;
  url: string;
  domain: string;
  riskScore: number;
  threats: { phishing, malware, social };
  blocked: boolean;
  recommendation: "allow" | "warn" | "block";
  explanation: string;
}
```

### Deliverables
- [ ] Extension installable in Chrome
- [ ] Authentication working
- [ ] URL analysis functional
- [ ] Warning overlays display correctly
- [ ] Statistics sync with backend
- [ ] Settings persist
- [ ] Chrome Web Store ready

### Documentation Requirements
- User installation guide
- API integration documentation
- Testing checklist
- Privacy policy

---

## Component 3: Backend & Infrastructure

**Owner:** Backend Team (You)
**Primary Deliverables:**
- API Gateway + Lambda functions
- Database (PostgreSQL)
- Authentication (Cognito/Supabase)
- Web dashboard deployment

### Core Responsibilities

#### API Development
- Lambda functions for all endpoints
- URL analysis orchestration
- Statistics aggregation
- Settings management
- Feedback collection

#### Database Management
- Prisma schema design
- User accounts and settings
- Analysis history storage
- URL caching for performance
- Data retention policies

#### Infrastructure
- AWS CDK deployment scripts
- Supabase database setup (recommended)
- S3 bucket for ML models
- API Gateway configuration
- Monitoring and logging

#### Web Dashboard
- React dashboard for users
- Authentication flow
- Statistics visualization
- Settings management
- Analysis history view

### Integration Contracts

**ML Lambda Integration:**
- Invoke ML Lambda from analyze endpoint
- Handle timeout and errors gracefully
- Fall back to rule-based detection if ML fails
- Cache results for 24 hours

**Extension Integration:**
- Provide REST API endpoints
- JWT authentication validation
- CORS configuration for extension
- Rate limiting per user (100 req/hour)

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/analyze` | POST | Analyze URL for threats |
| `/stats` | GET | Get user statistics |
| `/settings` | GET/PUT | User preferences |
| `/settings/whitelist` | POST | Add trusted domain |
| `/feedback` | POST | Submit user feedback |
| `/health` | GET | Health check (no auth) |

### Deliverables
- [ ] All API endpoints deployed
- [ ] Database schema deployed
- [ ] Authentication working
- [ ] ML Lambda integration functional
- [ ] Dashboard deployed and accessible
- [ ] API documentation complete
- [ ] Monitoring configured

### Documentation Requirements
- API reference documentation
- Database schema documentation
- Deployment guide
- Integration testing guide

---

## Communication & Coordination

### Integration Points

**Backend ↔ ML:**
- **Frequency:** As needed, primarily during initial integration
- **Topics:** Lambda invocation format, error handling, performance optimization
- **Channel:** Direct communication for issues

**Backend ↔ Extension:**
- **Frequency:** Daily during development
- **Topics:** API contract, authentication flow, error handling
- **Channel:** Direct communication for issues

**ML ↔ Extension:**
- **Frequency:** Minimal (via Backend)
- **Topics:** Understanding risk scores and recommendations
- **Channel:** Backend team coordinates

### Issue Resolution

**Technical Blocker:**
1. Try to resolve independently
2. If stuck >30 minutes, reach out to relevant team member
3. Document issue and resolution for future reference

**API Contract Changes:**
1. Propose change with justification
2. Get agreement from affected teams
3. Update documentation
4. Coordinate deployment timing

**Performance Issues:**
1. Identify bottleneck (ML, API, Database, Extension)
2. Owner of bottleneck investigates
3. Coordinate on solution
4. Test end-to-end after fix

---

## Success Criteria

### MVP Requirements
- Extension detects phishing with >80% accuracy
- API response time <500ms (p95)
- Dashboard displays user statistics
- All three components integrated and working
- Chrome Web Store approved
- Costs <$20/month

### Individual Component Success

**ML Component:**
- ✅ Model deployed to Lambda
- ✅ Inference time <500ms
- ✅ Accuracy >80%
- ✅ Fallback system works

**Extension Component:**
- ✅ Chrome Web Store approved
- ✅ Warning system functional
- ✅ Settings sync with backend
- ✅ User-friendly interface

**Backend Component:**
- ✅ All API endpoints working
- ✅ Database operational
- ✅ Dashboard deployed
- ✅ Integration tests passing

---

## Testing Strategy

### Unit Testing
- Each component tests its own functionality independently
- ML: Model inference correctness
- Extension: UI components, API calls
- Backend: API endpoints, database queries

### Integration Testing
- Backend team coordinates integration tests
- Test ML Lambda invocation from API
- Test Extension API calls end-to-end
- Verify data flow through entire system

### End-to-End Testing
```
1. User installs extension
2. User signs up via dashboard
3. User visits suspicious URL
4. Extension sends to backend
5. Backend calls ML Lambda
6. ML returns risk score
7. Backend stores result
8. Extension displays warning
9. User submits feedback
10. Dashboard shows statistics
```

---

## Deployment Sequence

**Phase 1: Infrastructure (Backend)**
- Deploy database
- Deploy API Gateway + Lambda
- Deploy authentication
- Test API endpoints

**Phase 2: ML Integration**
- Deploy ML Lambda
- Upload model to S3
- Test ML invocation from backend
- Verify response format

**Phase 3: Extension Integration**
- Build extension
- Test against staging API
- Verify authentication flow
- Test warning displays

**Phase 4: Dashboard Deployment**
- Deploy dashboard
- Test authentication
- Verify statistics display
- Test settings management

**Phase 5: End-to-End Validation**
- Test complete user flow
- Verify all integrations
- Load testing
- Security review

**Phase 6: Launch**
- Deploy to production
- Submit extension to Chrome Web Store
- Monitor logs and metrics
- Respond to issues

---

## Ownership Matrix

| Component | Primary Owner | Secondary Support |
|-----------|---------------|-------------------|
| ML Lambda | ML Team | Backend Team |
| Model Storage (S3) | ML Team | Backend Team |
| Inference Logic | ML Team | - |
| API Gateway | Backend Team | - |
| Lambda Functions (API) | Backend Team | - |
| Database Schema | Backend Team | - |
| Authentication | Backend Team | Extension Team |
| Web Dashboard | Backend Team | - |
| Browser Extension | Extension Team | - |
| Content Scripts | Extension Team | - |
| Popup UI | Extension Team | - |
| Documentation | All Teams | Backend Team Leads |

---

## Contact & Support

### For ML Team
- **Questions about:** API integration, database access, deployment
- **Contact:** Backend Team
- **Documentation:** `/docs/01-ml-integration.md`, `/docs/security/01-ml-security.md`

### For Extension Team
- **Questions about:** API endpoints, authentication, rate limits
- **Contact:** Backend Team
- **Documentation:** `/docs/02-extension-integration.md`, `/docs/security/02-extension-security.md`

### For Backend Team
- **Questions about:** ML output format, model performance
- **Contact:** ML Team
- **Questions about:** Extension requirements, user experience
- **Contact:** Extension Team
- **Documentation:** `/docs/03-backend-implementation.md`, `/docs/security/03-backend-security.md`
