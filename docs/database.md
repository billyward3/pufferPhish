# Database Schema & Design

## PostgreSQL Configuration

### Connection Details
```yaml
Development:
  Host: localhost
  Port: 5432
  Database: pufferphish_dev
  Username: postgres
  Password: postgres

Production:
  Host: <RDS_ENDPOINT>.rds.amazonaws.com
  Port: 5432
  Database: pufferphish
  Username: <SECURE_USERNAME>
  Password: <FROM_SECRETS_MANAGER>
```

## Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User account linked to Cognito
model User {
  id            String   @id @default(uuid())
  cognitoId     String   @unique
  email         String   @unique
  tier          String   @default("free") // free, premium
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  analyses      Analysis[]
  feedback      Feedback[]
  settings      UserSettings?
  
  @@index([email])
  @@index([cognitoId])
}

// User preferences and settings
model UserSettings {
  id                String   @id @default(uuid())
  userId            String   @unique
  autoBlock         Boolean  @default(true)
  notifications     Boolean  @default(true)
  whitelistedDomains String[] // Array of domains
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// URL analysis results
model Analysis {
  id            String   @id @default(uuid())
  userId        String
  url           String   @db.Text
  domain        String
  riskScore     Float    // 0.0 to 1.0
  threats       Json     // {phishing: 0.8, malware: 0.2, social: 0.5}
  blocked       Boolean
  source        String   // "ml", "rule", "external_api", "manual"
  metadata      Json?    // Additional data like headers, referrer
  timestamp     DateTime @default(now())
  
  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  feedback      Feedback?
  
  @@index([userId, timestamp(sort: Desc)])
  @@index([domain])
  @@index([timestamp])
}

// User feedback on analysis accuracy
model Feedback {
  id            String   @id @default(uuid())
  analysisId    String   @unique
  userId        String
  correct       Boolean  // Was our analysis correct?
  actualThreat  String?  // If incorrect, what was actual threat
  comment       String?  @db.Text
  timestamp     DateTime @default(now())
  
  // Relations
  analysis      Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([timestamp])
}

// Cache for external API results
model UrlCache {
  url           String   @id
  riskScore     Float
  threats       Json
  source        String   // "google_safe", "phishtank", "urlhaus"
  rawResponse   Json     // Store full API response
  checkedAt     DateTime @default(now())
  expiresAt     DateTime
  
  @@index([expiresAt])
  @@index([checkedAt])
}

// Known threat intelligence
model ThreatIntel {
  id            String   @id @default(uuid())
  domain        String   @unique
  threatType    String   // "phishing", "malware", "spam"
  confidence    Float    // 0.0 to 1.0
  source        String   // Where we got this intel
  firstSeen     DateTime
  lastSeen      DateTime @default(now())
  active        Boolean  @default(true)
  
  @@index([domain])
  @@index([active, threatType])
  @@index([lastSeen])
}

// ML model versions for tracking
model ModelVersion {
  id            String   @id @default(uuid())
  version       String   @unique
  s3Path        String
  accuracy      Float?
  deployedAt    DateTime @default(now())
  active        Boolean  @default(false)
  metadata      Json     // Model configuration, hyperparameters
  
  @@index([active])
  @@index([deployedAt])
}

// Analytics and metrics
model Metrics {
  id            String   @id @default(uuid())
  date          DateTime @db.Date
  totalScans    Int      @default(0)
  threatsBlocked Int     @default(0)
  falsePositives Int     @default(0)
  falseNegatives Int     @default(0)
  avgLatency    Float?   // milliseconds
  uniqueUsers   Int      @default(0)
  
  @@unique([date])
  @@index([date])
}
```

## Database Indexes

### Performance Optimization
```sql
-- Most common queries optimized
CREATE INDEX idx_analysis_user_time ON "Analysis"("userId", "timestamp" DESC);
CREATE INDEX idx_analysis_domain ON "Analysis"("domain");
CREATE INDEX idx_cache_expires ON "UrlCache"("expiresAt");
CREATE INDEX idx_threat_active ON "ThreatIntel"("active", "threatType");
```

## Data Migrations

### Initial Setup
```bash
# Create initial migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

### Adding Fields
```bash
# Add field to schema, then:
npx prisma migrate dev --name add_user_tier

# Migration file created in prisma/migrations/
```

## Data Seeding

```typescript
// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      cognitoId: 'test-cognito-id',
      email: 'test@example.com',
      settings: {
        create: {
          autoBlock: true,
        },
      },
    },
  });

  // Add sample analyses
  await prisma.analysis.createMany({
    data: [
      {
        userId: user.id,
        url: 'http://phishing-test.com',
        domain: 'phishing-test.com',
        riskScore: 0.95,
        threats: { phishing: 0.95, malware: 0.1 },
        blocked: true,
        source: 'ml',
      },
      {
        userId: user.id,
        url: 'https://safe-site.com',
        domain: 'safe-site.com',
        riskScore: 0.05,
        threats: { phishing: 0.05, malware: 0.0 },
        blocked: false,
        source: 'rule',
      },
    ],
  });

  // Add threat intelligence
  await prisma.threatIntel.createMany({
    data: [
      {
        domain: 'known-phishing.com',
        threatType: 'phishing',
        confidence: 0.99,
        source: 'phishtank',
        firstSeen: new Date(),
      },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

## Query Patterns

### Common Queries

#### Get User Stats
```typescript
const stats = await prisma.analysis.aggregate({
  where: { userId: userId },
  _count: true,
  _avg: { riskScore: true },
});
```

#### Check URL Cache
```typescript
const cached = await prisma.urlCache.findFirst({
  where: {
    url: url,
    expiresAt: { gt: new Date() },
  },
});
```

#### Recent Analyses
```typescript
const recent = await prisma.analysis.findMany({
  where: { userId: userId },
  orderBy: { timestamp: 'desc' },
  take: 10,
  include: { feedback: true },
});
```

## Database Maintenance

### Backup Strategy
```yaml
Automated Backups:
  Frequency: Daily at 3am UTC
  Retention: 7 days
  Type: Automated snapshots

Manual Backups:
  Before major deployments
  After data migrations
  Monthly full backup archived to S3
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Data Retention

#### Cleanup Jobs
```typescript
// Lambda function to run daily
export async function cleanupOldData() {
  // Delete old cache entries
  await prisma.urlCache.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  // Archive old analyses (>90 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const oldAnalyses = await prisma.analysis.findMany({
    where: { timestamp: { lt: cutoffDate } },
  });
  
  // Archive to S3
  await archiveToS3(oldAnalyses);
  
  // Delete from database
  await prisma.analysis.deleteMany({
    where: { timestamp: { lt: cutoffDate } },
  });
}
```

## Security Considerations

### Connection Security
- Use SSL/TLS for all connections
- Rotate database passwords quarterly
- Use AWS Secrets Manager for credentials
- Implement connection pooling

### Data Protection
- Encrypt sensitive fields (future)
- No PII in logs
- GDPR compliance for EU users
- Regular security audits

### Access Control
```typescript
// Row-level security example
const userAnalyses = await prisma.analysis.findMany({
  where: {
    userId: authenticatedUserId, // Always filter by user
  },
});
```