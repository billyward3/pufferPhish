# System Architecture

## Tech Stack

- **Frontend:** TypeScript, React (Vite), Chrome Extension API
- **Backend:** AWS Lambda, API Gateway HTTP, Node.js
- **Database:** RDS PostgreSQL
- **Auth:** AWS Cognito
- **ML:** Pretrained Hugging Face model on Lambda
- **Infrastructure:** AWS CDK (TypeScript)
- **Hosting:** S3 + CloudFront (dashboard), Lambda (API)

## Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐
│ Chrome Extension│────────▶│ API Gateway HTTP │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Lambda Functions│
                            │ - analyze       │
                            | - feedback      │
                            │ - stats         │
                            └─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │   Cognito    │ │  RDS (PG)    │ │External APIs │
            │   (Auth)     │ │  Database    │ │-Google Safe  │
            └──────────────┘ └──────────────┘ │-PhishTank    │
                                              └──────────────┘
                    
┌─────────────────┐         ┌──────────────────┐
│ React Dashboard │────────▶│   CloudFront     │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │    S3 Bucket     │
                            └──────────────────┘
```

## Component Breakdown

### Browser Extension
**Technology:** Vanilla TypeScript + Webpack
- **Manifest v3:** Modern Chrome extension architecture
- **Service Worker:** Background processing and API calls
- **Content Scripts:** Page analysis and warning injection
- **Popup UI:** User interaction and quick settings

### Web Dashboard
**Technology:** React + TypeScript + Vite
- **Hosting:** S3 static hosting with CloudFront CDN
- **State Management:** React Query for server state
- **UI Framework:** Tailwind CSS for styling
- **Charts:** Recharts for data visualization

### API Layer
**Technology:** Node.js + TypeScript
- **API Gateway HTTP:** Lower cost, better performance than REST
- **Lambda Functions:** Serverless compute for all endpoints
- **Authentication:** JWT validation via Cognito authorizer
- **Rate Limiting:** Built into Cognito user pools

### Database
**Service:** RDS PostgreSQL (t3.micro)
- **ORM:** Prisma for type-safe database access
- **Caching:** URL results cached for 24 hours
- **Indexes:** Optimized for user queries and domain lookups
- **Backup:** Automated daily snapshots

### ML Detection Engine
**Approach:** Lambda-based inference
- **Model Storage:** S3 bucket for model files
- **Inference:** Lambda function with 3GB memory
- **Fallback:** Rule-based detection if ML fails
- **Updates:** Blue-green deployment for model updates

### External API Integration
**Strategy:** Cached proxy through Lambda
- **Primary APIs:**
  - Google Safe Browsing (10k requests/day)
  - PhishTank (unlimited)
  - URLhaus (unlimited)
- **Caching:** 24-hour cache in PostgreSQL
- **Failover:** Multiple APIs for redundancy

## Data Flow

### URL Analysis Flow
1. User clicks suspicious link in browser
2. Extension extracts URL and metadata
3. Extension sends request to API Gateway
4. Lambda checks cache first
5. If not cached:
   - Run ML model inference
   - Query external APIs
   - Apply rule-based checks
6. Store result in database
7. Return risk assessment to extension
8. Extension displays warning if needed

### Authentication Flow
1. User signs up via dashboard
2. Cognito creates user account
3. User receives JWT tokens
4. Extension stores tokens securely
5. All API requests include JWT
6. API Gateway validates token
7. Lambda receives authenticated request

## Scalability Considerations

### Current Limits (MVP)
- 100 concurrent users
- 1000 URL checks per hour
- Single region deployment

### Scaling Strategy
- Lambda auto-scales to 1000 concurrent executions
- RDS can upgrade to larger instance types
- CloudFront provides global edge caching
- API Gateway handles millions of requests
- Cognito scales to millions of users

## Cost Optimization

### Serverless Benefits
- Pay only for actual usage
- No idle server costs
- Automatic scaling
- Built-in high availability

### Caching Strategy
- 24-hour URL result caching
- CloudFront caching for dashboard
- ElastiCache for hot data (future)

### Reserved Capacity (Future)
- RDS reserved instances (70% savings)
- Lambda provisioned concurrency (if needed)