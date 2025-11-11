# ML Component Security Guidelines

## Model Security

### Model Storage & Access

```typescript
// S3 bucket security for ML models
const modelBucket = new s3.Bucket(this, 'ModelBucket', {
  publicReadAccess: false,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  versioned: true
});

// Only ML Lambda can access models
modelBucket.grantRead(mlLambdaRole);
```

### Input Validation

```python
# Validate inputs before ML inference
def validate_url_input(url: str) -> bool:
    """Validate URL before processing"""
    if not url or len(url) > 2048:
        return False

    try:
        parsed = urlparse(url)
        return parsed.scheme in ['http', 'https']
    except:
        return False

def sanitize_metadata(metadata: dict) -> dict:
    """Sanitize metadata to prevent injection"""
    safe_metadata = {}
    allowed_keys = ['referrer', 'userAgent', 'pageContent']

    for key in allowed_keys:
        if key in metadata:
            value = str(metadata[key])[:1000]  # Limit length
            safe_metadata[key] = value

    return safe_metadata
```

### Model Poisoning Prevention

**Threat:** Malicious actors trying to corrupt model

**Mitigations:**
- Store models in versioned S3 bucket
- Sign model files with checksums
- Validate model integrity before loading
- Separate training/production environments

```python
import hashlib

def verify_model_integrity(model_path: str, expected_hash: str) -> bool:
    """Verify model hasn't been tampered with"""
    sha256 = hashlib.sha256()

    with open(model_path, 'rb') as f:
        while chunk := f.read(8192):
            sha256.update(chunk)

    actual_hash = sha256.hexdigest()

    if actual_hash != expected_hash:
        raise SecurityError(f"Model integrity check failed")

    return True

# Load model only after verification
model_hash = get_expected_hash_from_metadata()
verify_model_integrity('model.bin', model_hash)
model = load_model('model.bin')
```

## Lambda Security

### IAM Permissions (Least Privilege)

```typescript
const mlLambdaRole = new iam.Role(this, 'MlLambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  inlinePolicies: {
    MinimalPermissions: new iam.PolicyDocument({
      statements: [
        // Only read access to model bucket
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [`${modelBucket.bucketArn}/models/*`]
        }),
        // Only write to own logs
        new iam.PolicyStatement({
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          resources: [
            `arn:aws:logs:${region}:${account}:log-group:/aws/lambda/ml-*`
          ]
        }),
        // Read model version from database (if using RDS)
        new iam.PolicyStatement({
          actions: ['rds-data:ExecuteStatement'],
          resources: [dbArn],
          conditions: {
            StringEquals: {
              'rds-data:statement-tag/Purpose': 'ModelVersionRead'
            }
          }
        })
      ]
    })
  }
});
```

### Dependency Security

```json
// package.json - Lock dependencies
{
  "dependencies": {
    "onnxruntime-node": "1.14.0",
    "tokenizers": "0.13.3"
  },
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "check-deps": "npm outdated"
  }
}
```

```bash
# Regular security audits
npm audit
npm audit fix

# Check for known vulnerabilities
pip-audit requirements.txt
```

### Resource Limits

```typescript
const mlLambda = new lambda.Function(this, 'MlLambda', {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'inference.handler',
  timeout: cdk.Duration.seconds(30),  // Prevent runaway execution
  memorySize: 2048,                    // Limit memory usage
  reservedConcurrentExecutions: 100,   // Prevent DoS via exhaustion
  deadLetterQueue: dlq,                // Handle failures safely
  environment: {
    // No sensitive data in environment variables
    MODEL_BUCKET: modelBucket.bucketName,
    MODEL_VERSION: 'latest'
  }
});
```

## Data Protection

### Sensitive Data Handling

**Do Not Store:**
- User passwords or credentials
- Full page content (only features)
- Personal identifiable information
- Credit card or payment information

**Safe to Store:**
- URL being analyzed
- Domain name
- Risk scores and probabilities
- Model version used
- Processing timestamps

```python
def extract_safe_features(page_content: str) -> dict:
    """Extract only safe features for ML"""
    return {
        'url_length': len(page_content),
        'has_form': '<form' in page_content,
        'has_login': 'login' in page_content.lower(),
        'domain_age_days': get_domain_age(),
        # DO NOT include actual content
    }
```

### Logging Security

```python
import json
import logging

# Structured logging without sensitive data
logger = logging.getLogger()

def log_inference(url: str, result: dict):
    """Log inference safely"""
    log_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'domain': urlparse(url).netloc,  # Domain only, not full URL
        'risk_score': result['risk_score'],
        'model_version': result['model_version'],
        'inference_time_ms': result['processing_time']
    }

    # Do not log:
    # - Full URLs (may contain tokens/credentials)
    # - User IDs
    # - Page content
    # - Query parameters

    logger.info(json.dumps(log_data))
```

## Monitoring & Alerting

### Security Metrics

```typescript
// CloudWatch alarms for suspicious activity
new cloudwatch.Alarm(this, 'HighErrorRate', {
  metric: mlLambda.metricErrors({
    period: cdk.Duration.minutes(5)
  }),
  threshold: 10,  // 10 errors in 5 minutes
  evaluationPeriods: 1,
  alarmDescription: 'ML Lambda experiencing high error rate'
});

new cloudwatch.Alarm(this, 'UnusualInvocations', {
  metric: mlLambda.metricInvocations({
    period: cdk.Duration.minutes(1)
  }),
  threshold: 1000,  // 1000 requests/minute
  evaluationPeriods: 2,
  alarmDescription: 'Possible DoS attack on ML Lambda'
});
```

### Audit Trail

```python
def log_security_event(event_type: str, details: dict):
    """Log security-relevant events"""
    audit_log = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'lambda_request_id': context.aws_request_id,
        'details': details
    }

    logger.warning(json.dumps(audit_log))

# Example usage
if model_load_failed:
    log_security_event('MODEL_LOAD_FAILURE', {
        'model_version': version,
        'error': str(error)
    })

if integrity_check_failed:
    log_security_event('MODEL_INTEGRITY_FAILURE', {
        'model_path': path,
        'expected_hash': expected,
        'actual_hash': actual
    })
```

## Deployment Security

### Secrets Management

```typescript
// Store sensitive config in Secrets Manager
const mlConfig = new secretsmanager.Secret(this, 'MlConfig', {
  secretName: 'pufferphish/ml-config',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      model_bucket: modelBucket.bucketName,
      fallback_api_key: 'placeholder'
    }),
    generateStringKey: 'api_key'
  }
});

// Lambda accesses via SDK, not environment variables
mlLambdaRole.addToPolicy(
  new iam.PolicyStatement({
    actions: ['secretsmanager:GetSecretValue'],
    resources: [mlConfig.secretArn]
  })
);
```

### Version Control

```python
def get_active_model_version() -> str:
    """Get active model version from secure source"""
    # Option 1: From database (most secure)
    version = query_active_model_version()

    # Option 2: From S3 metadata
    # version = get_s3_metadata('models/active_version')

    # Option 3: From Secrets Manager
    # version = get_secret('ml-config')['model_version']

    return version

def load_model_safely(version: str):
    """Load model with security checks"""
    # 1. Validate version format
    if not re.match(r'^v\d+\.\d+\.\d+$', version):
        raise ValueError('Invalid version format')

    # 2. Check version exists and is approved
    if not is_approved_version(version):
        raise SecurityError('Version not approved for production')

    # 3. Download from S3
    model_path = download_model_from_s3(version)

    # 4. Verify integrity
    verify_model_integrity(model_path, get_expected_hash(version))

    # 5. Load model
    return load_model(model_path)
```

## Incident Response

### ML Security Incident Types

1. **Model Poisoning Detected**
   - Action: Immediately rollback to previous version
   - Investigate: Review model training logs
   - Notify: Backend team, security team

2. **Unusual Inference Patterns**
   - Action: Enable additional logging
   - Investigate: Check for coordinated attacks
   - Consider: Temporary rate limiting

3. **Dependency Vulnerability**
   - Action: Patch immediately if critical
   - Test: Verify model still works
   - Deploy: Hot-fix deployment

### Emergency Procedures

```bash
# Rollback to previous model version
aws lambda update-function-configuration \
  --function-name pufferphish-ml-analyze \
  --environment Variables="{MODEL_VERSION=v1.0.0}"

# Disable ML Lambda (use fallback only)
aws lambda put-function-concurrency \
  --function-name pufferphish-ml-analyze \
  --reserved-concurrent-executions 0

# Check recent invocations for anomalies
aws logs tail /aws/lambda/pufferphish-ml-analyze --follow \
  --filter-pattern "ERROR"
```

## Security Checklist

### Pre-Deployment
- [ ] Model integrity checksums verified
- [ ] Dependencies security audited (`npm audit`, `pip-audit`)
- [ ] IAM permissions follow least privilege
- [ ] No sensitive data in logs
- [ ] Resource limits configured
- [ ] Secrets stored in Secrets Manager
- [ ] Model versions properly tagged

### Runtime
- [ ] CloudWatch alarms configured
- [ ] Error rate monitored
- [ ] Unusual patterns detected
- [ ] Logs reviewed for anomalies

### Post-Incident
- [ ] Model integrity re-verified
- [ ] Access logs reviewed
- [ ] Compromised versions removed
- [ ] Security patches applied
- [ ] Team debriefed
