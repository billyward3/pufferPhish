# Backend & Infrastructure Security Guidelines

## API Security

### Authentication & Authorization

#### JWT Token Validation

```typescript
// Lambda authorizer or validation function
import { verify } from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';

export async function validateToken(authHeader?: string): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // If using Cognito
    const decoded = await verifyCognitoToken(token);
    return decoded.sub;  // User ID

    // If using Supabase
    // const { data } = await supabase.auth.getUser(token);
    // return data.user.id;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Verify Cognito JWT
async function verifyCognitoToken(token: string) {
  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const jwks = await fetchJWKS(jwksUrl);

  return verify(token, jwks, {
    algorithms: ['RS256'],
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
  });
}
```

#### Rate Limiting

```typescript
// Application-level rate limiting
import { RateLimiter } from 'limiter';

const limiters = new Map<string, RateLimiter>();

export function checkRateLimit(userId: string): boolean {
  if (!limiters.has(userId)) {
    // 100 requests per hour per user
    limiters.set(userId, new RateLimiter({
      tokensPerInterval: 100,
      interval: 'hour'
    }));
  }

  const limiter = limiters.get(userId)!;

  if (limiter.tryRemoveTokens(1)) {
    return true;  // Allowed
  }

  throw new Error('Rate limit exceeded');
}

// API Gateway throttling (infrastructure level)
const api = new apigateway.HttpApi(this, 'Api', {
  defaultThrottle: {
    rateLimit: 100,    // requests per second
    burstLimit: 200    // burst capacity
  }
});
```

#### CORS Configuration

```typescript
// Secure CORS setup
const api = new apigateway.HttpApi(this, 'Api', {
  corsPreflight: {
    allowOrigins: [
      'https://dashboard.pufferphish.com',
      'chrome-extension://YOUR_EXTENSION_ID'
    ],
    allowMethods: [
      apigateway.CorsHttpMethod.GET,
      apigateway.CorsHttpMethod.POST,
      apigateway.CorsHttpMethod.PUT,
      apigateway.CorsHttpMethod.DELETE
    ],
    allowHeaders: [
      'Content-Type',
      'Authorization'
    ],
    allowCredentials: true,
    maxAge: cdk.Duration.hours(1)
  }
});

// DO NOT use '*' for production:
// allowOrigins: ['*']  // INSECURE!
```

### Input Validation & Sanitization

#### URL Validation

```typescript
import validator from 'validator';

export function validateUrl(url: string): string {
  // Length check
  if (!url || url.length > 2048) {
    throw new Error('Invalid URL length');
  }

  // Format validation
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  })) {
    throw new Error('Invalid URL format');
  }

  // Prevent SSRF attacks
  const parsed = new URL(url);
  const blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '169.254.169.254',  // AWS metadata service
    '[::1]'
  ];

  const hostname = parsed.hostname.toLowerCase();

  if (blockedHosts.some(blocked => hostname.includes(blocked))) {
    throw new Error('Forbidden URL');
  }

  // Block private IP ranges
  if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) {
    throw new Error('Private network URLs not allowed');
  }

  return url;
}
```

#### SQL Injection Prevention

```typescript
// Using Prisma (parameterized queries, safe by default)
const analyses = await prisma.analysis.findMany({
  where: {
    userId: userId,          // Parameterized
    domain: {
      contains: userInput    // Safe string operation
    }
  },
  orderBy: {
    timestamp: 'desc'
  },
  take: 10
});

// NEVER do this:
// const query = `SELECT * FROM analyses WHERE userId = '${userId}'`;
// Raw SQL queries are dangerous!
```

#### NoSQL Injection Prevention

```typescript
// Validate and sanitize JSON inputs
function validateFeedbackInput(input: any) {
  const schema = {
    analysisId: 'string',
    correct: 'boolean',
    actualThreat: 'string?',
    comment: 'string?'
  };

  // Type validation
  if (typeof input.correct !== 'boolean') {
    throw new Error('Invalid feedback format');
  }

  // Length limits
  if (input.comment && input.comment.length > 1000) {
    throw new Error('Comment too long');
  }

  // Whitelist allowed values
  const allowedThreats = ['none', 'phishing', 'malware', 'social', 'spam'];
  if (input.actualThreat && !allowedThreats.includes(input.actualThreat)) {
    throw new Error('Invalid threat type');
  }

  return {
    analysisId: input.analysisId,
    correct: input.correct,
    actualThreat: input.actualThreat || null,
    comment: input.comment?.substring(0, 1000) || null
  };
}
```

### Error Handling

```typescript
// Safe error responses
export function handleError(error: any) {
  console.error('Error:', error);  // Log full error internally

  // Return sanitized error to client
  if (error.message === 'Invalid token') {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      })
    };
  }

  if (error.message === 'Rate limit exceeded') {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 3600
        }
      })
    };
  }

  // Generic error (don't expose internals)
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again.'
      }
    })
  };
}

// DO NOT return stack traces to clients!
// DO NOT expose database errors directly!
```

## Database Security

### Connection Security

```typescript
// Secure database connection
const DATABASE_URL = process.env.DATABASE_URL!;

// Enforce SSL
if (process.env.NODE_ENV === 'production' && !DATABASE_URL.includes('sslmode=require')) {
  throw new Error('Database must use SSL in production');
}

// Connection pooling (prevents exhaustion attacks)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}?connection_limit=5&pool_timeout=10`
    }
  }
});
```

### Row-Level Security

```typescript
// Always filter by authenticated user
export async function getUserAnalyses(userId: string, limit: number = 20) {
  return await prisma.analysis.findMany({
    where: {
      userId: userId  // ALWAYS include user filter
    },
    orderBy: { timestamp: 'desc' },
    take: Math.min(limit, 100)  // Limit maximum results
  });
}

// NEVER allow queries without user filter:
// await prisma.analysis.findMany();  // INSECURE! Returns all users' data
```

### Data Encryption

```typescript
// Encrypt sensitive fields before storage
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;  // 32 bytes, from Secrets Manager
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];

  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Use for sensitive data (if needed)
await prisma.user.create({
  data: {
    email: email,
    // encryptedData: encrypt(sensitiveInfo)
  }
});
```

### Secrets Management

```typescript
// AWS Secrets Manager
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager({ region: 'us-east-1' });

async function getDatabaseCredentials() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'pufferphish/database'
  });

  return JSON.parse(secret.SecretString!);
}

// Lambda initialization
let dbCredentials: any;

export async function handler(event: any) {
  if (!dbCredentials) {
    dbCredentials = await getDatabaseCredentials();
  }

  // Use credentials
  const DATABASE_URL = `postgresql://${dbCredentials.username}:${dbCredentials.password}@${dbCredentials.host}:5432/pufferphish`;

  // ... rest of handler
}
```

## Infrastructure Security

### IAM Policies (Least Privilege)

```typescript
// Lambda execution role - minimal permissions
const apiLambdaRole = new iam.Role(this, 'ApiLambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  inlinePolicies: {
    MinimalPermissions: new iam.PolicyDocument({
      statements: [
        // Logging only
        new iam.PolicyStatement({
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          resources: [
            `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/pufferphish-*`
          ]
        }),
        // Invoke ML Lambda
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [
            `arn:aws:lambda:${this.region}:${this.account}:function:pufferphish-ml-*`
          ]
        }),
        // Read secrets
        new iam.PolicyStatement({
          actions: ['secretsmanager:GetSecretValue'],
          resources: [
            `arn:aws:secretsmanager:${this.region}:${this.account}:secret:pufferphish/*`
          ]
        })
      ]
    })
  }
});

// DO NOT use:
// managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')]  // TOO BROAD!
```

### Network Security

#### VPC Configuration (Optional for Enhanced Security)

```typescript
// Private subnet for Lambda and database
const vpc = new ec2.Vpc(this, 'VPC', {
  maxAzs: 2,
  natGateways: 1,
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24
    }
  ]
});

// Security group for database
const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
  vpc,
  description: 'Security group for RDS database',
  allowAllOutbound: false
});

// Only allow Lambda to access database
const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSG', {
  vpc,
  description: 'Security group for Lambda functions'
});

dbSecurityGroup.addIngressRule(
  lambdaSecurityGroup,
  ec2.Port.tcp(5432),
  'Allow Lambda to connect to PostgreSQL'
);

// Lambda in private subnet
const apiLambda = new lambda.Function(this, 'ApiLambda', {
  // ... other config
  vpc: vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [lambdaSecurityGroup]
});
```

#### Security Groups Rules

```typescript
// Deny all by default, allow specific
const restrictiveSecurityGroup = new ec2.SecurityGroup(this, 'RestrictiveSG', {
  vpc,
  allowAllOutbound: false  // Explicit deny
});

// Allow only HTTPS outbound
restrictiveSecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'Allow HTTPS outbound'
);

// Allow database connection
restrictiveSecurityGroup.addEgressRule(
  ec2.Peer.securityGroupId(dbSecurityGroup.securityGroupId),
  ec2.Port.tcp(5432),
  'Allow PostgreSQL to RDS'
);
```

### S3 Bucket Security

```typescript
// Secure S3 configuration
const modelBucket = new s3.Bucket(this, 'ModelBucket', {
  bucketName: 'pufferphish-ml-models',

  // Access control
  publicReadAccess: false,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

  // Encryption
  encryption: s3.BucketEncryption.S3_MANAGED,
  enforceSSL: true,  // Require HTTPS

  // Versioning
  versioned: true,

  // Lifecycle
  lifecycleRules: [
    {
      noncurrentVersionExpiration: cdk.Duration.days(30)
    }
  ],

  // Removal policy
  removalPolicy: cdk.RemovalPolicy.RETAIN  // Don't delete accidentally
});

// Bucket policy - deny insecure transport
modelBucket.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.DENY,
    principals: [new iam.AnyPrincipal()],
    actions: ['s3:*'],
    resources: [
      modelBucket.bucketArn,
      `${modelBucket.bucketArn}/*`
    ],
    conditions: {
      Bool: {
        'aws:SecureTransport': 'false'
      }
    }
  })
);
```

## Monitoring & Alerting

### CloudWatch Alarms

```typescript
// High error rate alarm
new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
  metric: apiLambda.metricErrors({
    period: cdk.Duration.minutes(5),
    statistic: 'Sum'
  }),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'API experiencing high error rate',
  actionsEnabled: true,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
});

// Unusual invocation patterns
new cloudwatch.Alarm(this, 'DDoSAlarm', {
  metric: apiGateway.metricCount({
    period: cdk.Duration.minutes(1),
    statistic: 'Sum'
  }),
  threshold: 10000,  // 10k requests/minute
  evaluationPeriods: 2,
  alarmDescription: 'Possible DDoS attack detected'
});

// Failed authentication attempts
new cloudwatch.Alarm(this, 'FailedAuthAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'PufferPhish/Security',
    metricName: 'FailedAuthentication',
    statistic: 'Sum',
    period: cdk.Duration.minutes(5)
  }),
  threshold: 50,
  evaluationPeriods: 1,
  alarmDescription: 'High number of failed authentication attempts'
});
```

### Security Logging

```typescript
// Structured security logging
interface SecurityLog {
  timestamp: string;
  event: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
}

function logSecurityEvent(event: string, details: any, context: any) {
  const securityLog: SecurityLog = {
    timestamp: new Date().toISOString(),
    event: event,
    userId: context.userId,
    ipAddress: context.sourceIp,
    userAgent: context.userAgent,
    details: details
  };

  console.log(JSON.stringify(securityLog));

  // Send to CloudWatch Logs
  // Optionally send critical events to SNS/Slack
}

// Usage examples
logSecurityEvent('AUTHENTICATION_FAILURE', {
  reason: 'Invalid token',
  attemptCount: 3
}, context);

logSecurityEvent('RATE_LIMIT_EXCEEDED', {
  endpoint: '/analyze',
  requestCount: 150
}, context);

logSecurityEvent('SUSPICIOUS_PATTERN', {
  pattern: 'Multiple failed requests',
  timeWindow: '5 minutes'
}, context);
```

### Audit Trail

```typescript
// Audit important actions
async function auditLog(action: string, userId: string, details: any) {
  await prisma.auditLog.create({
    data: {
      action: action,
      userId: userId,
      details: details,
      timestamp: new Date(),
      ipAddress: getCurrentIp(),
      userAgent: getCurrentUserAgent()
    }
  });
}

// Audit sensitive operations
await auditLog('USER_DELETED', userId, { reason: 'User requested' });
await auditLog('WHITELIST_ADDED', userId, { domain: 'example.com' });
await auditLog('SETTINGS_CHANGED', userId, { changes: {...} });
```

## Compliance & Privacy

### GDPR Compliance

```typescript
// User data export
export async function exportUserData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      analyses: true,
      feedback: true,
      settings: true
    }
  });

  return {
    personalInfo: {
      email: userData.email,
      createdAt: userData.createdAt
    },
    analyses: userData.analyses,
    feedback: userData.feedback,
    settings: userData.settings
  };
}

// User data deletion
export async function deleteUserData(userId: string) {
  // Log deletion for audit
  await auditLog('USER_DATA_DELETION', userId, {
    reason: 'GDPR request',
    dataTypes: ['user', 'analyses', 'feedback', 'settings']
  });

  // Delete all user data (cascading)
  await prisma.user.delete({
    where: { id: userId }
  });

  // Verify deletion
  const exists = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (exists) {
    throw new Error('User data deletion failed');
  }

  return { success: true, deletedAt: new Date() };
}
```

## Incident Response

### Detection

```bash
# Check CloudWatch logs for suspicious activity
aws logs filter-log-events \
  --log-group-name /aws/lambda/pufferphish-api \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Check failed authentications
aws logs filter-log-events \
  --log-group-name /aws/lambda/pufferphish-api \
  --filter-pattern "AUTHENTICATION_FAILURE" \
  --start-time $(date -u -d '24 hours ago' +%s)000

# Check rate limit violations
aws logs filter-log-events \
  --log-group-name /aws/lambda/pufferphish-api \
  --filter-pattern "RATE_LIMIT_EXCEEDED"
```

### Response Procedures

**1. API Key Compromised:**
```bash
# Rotate secrets immediately
aws secretsmanager rotate-secret \
  --secret-id pufferphish/api-keys \
  --rotation-lambda-arn arn:aws:lambda:xxx

# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name pufferphish-api \
  --environment Variables="{API_KEY=new-key}"
```

**2. Database Breach Suspected:**
```bash
# Change database password
aws secretsmanager update-secret \
  --secret-id pufferphish/database \
  --secret-string '{"username":"admin","password":"NEW_PASSWORD"}'

# Force password change on RDS
aws rds modify-db-instance \
  --db-instance-identifier pufferphish-db \
  --master-user-password NEW_PASSWORD \
  --apply-immediately
```

**3. DDoS Attack:**
```bash
# Enable AWS Shield
aws shield create-protection \
  --name pufferphish-api \
  --resource-arn arn:aws:apigateway:xxx

# Increase throttling temporarily
aws apigatewayv2 update-stage \
  --api-id xxx \
  --stage-name prod \
  --throttle-settings RateLimit=10,BurstLimit=20
```

## Security Checklist

### Pre-Deployment
- [ ] IAM roles follow least privilege
- [ ] Secrets stored in Secrets Manager
- [ ] Database connection uses SSL
- [ ] API uses HTTPS only
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] Error messages don't leak data
- [ ] CloudWatch alarms configured

### Runtime
- [ ] Monitor CloudWatch for anomalies
- [ ] Review failed authentication attempts
- [ ] Check for unusual traffic patterns
- [ ] Verify database query performance
- [ ] Audit logs reviewed regularly

### Regular Maintenance
- [ ] Rotate secrets quarterly
- [ ] Review IAM permissions monthly
- [ ] Update dependencies weekly
- [ ] Security audit annually
- [ ] Penetration testing biannually

## Resources

- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Well-Architected Framework - Security](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
