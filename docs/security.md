# Security Guidelines

## Extension Security

### Content Security Policy
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts; script-src 'self'"
  },
  "permissions": [
    "storage",
    "tabs",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.pufferphish.com/*"
  ]
}
```

### Secure Communication
```typescript
// Extension to API communication
async function callAPI(endpoint: string, data: any) {
  const token = await chrome.storage.local.get('authToken');
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.authToken}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('API call failed');
  }
  
  return response.json();
}
```

### Input Validation
```typescript
// Validate URLs before processing
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Sanitize user input
function sanitizeInput(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
```

## API Security

### Authentication & Authorization

#### JWT Validation
```typescript
// Lambda authorizer
export async function authorizer(event: APIGatewayRequestAuthorizerEvent) {
  const token = event.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  try {
    const decoded = await verifyToken(token);
    return {
      principalId: decoded.sub,
      policyDocument: generatePolicy('Allow', event.methodArn),
      context: {
        userId: decoded.sub,
        email: decoded.email,
      },
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
}
```

#### Rate Limiting
```typescript
// Using AWS API Gateway throttling
const api = new apigateway.HttpApi(this, 'Api', {
  defaultThrottle: {
    rateLimit: 100, // requests per second per user
    burstLimit: 200,
  },
});

// Additional application-level rate limiting
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 60;
  
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

### Input Validation & Sanitization

```typescript
// URL validation
import validator from 'validator';

function validateUrl(url: string): string {
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  })) {
    throw new Error('Invalid URL');
  }
  
  // Prevent SSRF attacks
  const parsed = new URL(url);
  const blacklistedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
  
  if (blacklistedHosts.includes(parsed.hostname)) {
    throw new Error('Forbidden URL');
  }
  
  return url;
}

// SQL injection prevention (using Prisma)
const analysis = await prisma.analysis.findMany({
  where: {
    userId: userId, // Parameterized query
    domain: {
      contains: userInput, // Safe string operation
    },
  },
});
```

## Infrastructure Security

### AWS IAM Policies

#### Least Privilege Lambda Role
```typescript
const lambdaRole = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  inlinePolicies: {
    MinimalPermissions: new iam.PolicyDocument({
      statements: [
        // Only what's needed
        new iam.PolicyStatement({
          actions: ['rds-data:ExecuteStatement'],
          resources: [database.instanceArn],
        }),
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [`${modelBucket.bucketArn}/*`],
        }),
        new iam.PolicyStatement({
          actions: ['secretsmanager:GetSecretValue'],
          resources: [dbSecret.secretArn],
        }),
      ],
    }),
  },
});
```

### Network Security

#### VPC Configuration
```typescript
// Isolate database in private subnet
const vpc = new ec2.Vpc(this, 'VPC', {
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
  ],
});

// Database only accessible from Lambda
const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
  vpc,
  allowAllOutbound: false,
});

dbSecurityGroup.addIngressRule(
  lambdaSecurityGroup,
  ec2.Port.tcp(5432),
  'Lambda access only'
);
```

### Secrets Management

```typescript
// Store sensitive data in AWS Secrets Manager
const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'admin' }),
    generateStringKey: 'password',
    excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
  },
});

// Rotate secrets automatically
dbSecret.addRotationSchedule('Rotation', {
  automaticallyAfter: cdk.Duration.days(90),
});
```

## Data Protection

### Encryption

#### At Rest
```typescript
// S3 bucket encryption
const bucket = new s3.Bucket(this, 'DataBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  versioned: true,
});

// RDS encryption
const database = new rds.DatabaseInstance(this, 'Database', {
  storageEncrypted: true,
  storageEncryptionKey: kmsKey,
});
```

#### In Transit
```typescript
// Enforce HTTPS only
const api = new apigateway.HttpApi(this, 'Api', {
  disableExecuteApiEndpoint: false,
});

// S3 bucket policy for HTTPS only
bucket.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.DENY,
    principals: [new iam.AnyPrincipal()],
    actions: ['s3:*'],
    resources: [`${bucket.bucketArn}/*`],
    conditions: {
      Bool: { 'aws:SecureTransport': 'false' },
    },
  })
);
```

### Privacy & Compliance

#### GDPR Compliance
```typescript
// User data deletion
async function deleteUserData(userId: string) {
  // Delete all user data
  await prisma.user.delete({
    where: { id: userId },
    include: {
      analyses: true,
      feedback: true,
      settings: true,
    },
  });
  
  // Log deletion for compliance
  await auditLog('USER_DATA_DELETED', { userId });
}

// Data export
async function exportUserData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      analyses: true,
      feedback: true,
      settings: true,
    },
  });
  
  return userData;
}
```

#### Audit Logging
```typescript
// Log all sensitive operations
async function auditLog(action: string, details: any) {
  await cloudwatch.putMetricData({
    Namespace: 'PufferPhish/Security',
    MetricData: [{
      MetricName: 'AuditEvent',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Action', Value: action },
      ],
    }],
  });
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    details,
  }));
}
```

## Security Monitoring

### CloudWatch Alarms

```typescript
// Suspicious activity detection
new cloudwatch.Alarm(this, 'SuspiciousActivity', {
  metric: new cloudwatch.Metric({
    namespace: 'PufferPhish/Security',
    metricName: 'FailedAuth',
    statistic: 'Sum',
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10, // 10 failed auth in 5 minutes
  evaluationPeriods: 1,
});

// DDoS detection
new cloudwatch.Alarm(this, 'PossibleDDoS', {
  metric: apiGateway.metricCount({
    period: cdk.Duration.minutes(1),
  }),
  threshold: 10000, // 10k requests per minute
  evaluationPeriods: 2,
});
```

### Security Headers

```typescript
// CloudFront security headers
const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
  securityHeadersBehavior: {
    contentTypeOptions: { override: true },
    frameOptions: {
      frameOption: cloudfront.HeadersFrameOption.DENY,
      override: true,
    },
    referrerPolicy: {
      referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
      override: true,
    },
    strictTransportSecurity: {
      accessControlMaxAge: cdk.Duration.days(365),
      includeSubdomains: true,
      override: true,
    },
    xssProtection: {
      protection: true,
      modeBlock: true,
      override: true,
    },
  },
});
```

## Incident Response

### Response Plan
1. **Detection:** CloudWatch alarms trigger
2. **Containment:** Auto-disable affected user/IP
3. **Investigation:** Review CloudWatch logs
4. **Remediation:** Fix vulnerability
5. **Recovery:** Restore service
6. **Lessons Learned:** Update security measures

### Emergency Procedures
```bash
# Disable API (emergency shutdown)
aws apigateway update-stage \
  --rest-api-id xxx \
  --stage-name prod \
  --patch-operations op=replace,path=/*/throttle/rateLimit,value=0

# Rotate all secrets immediately
aws secretsmanager rotate-secret \
  --secret-id prod/database \
  --rotation-lambda-arn arn:aws:lambda:xxx

# Block suspicious IP
aws wafv2 update-ip-set \
  --name blocked-ips \
  --addresses 1.2.3.4/32
```

## Security Checklist

### Pre-Deployment
- [ ] All dependencies updated
- [ ] Security scanning passed
- [ ] Secrets in Secrets Manager
- [ ] IAM policies reviewed
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] HTTPS enforced everywhere
- [ ] CSP headers configured

### Post-Deployment
- [ ] CloudWatch alarms active
- [ ] Audit logging enabled
- [ ] Backup strategy verified
- [ ] Incident response tested
- [ ] Security headers validated
- [ ] Penetration testing scheduled