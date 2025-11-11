# ML Model & Integration Guide

**Owner:** ML Team Member
**Integration Partners:** Backend Team (API endpoints)

## Overview

The ML detection engine is responsible for analyzing URLs and providing phishing risk scores. This component integrates with the backend API through a defined interface.

## Core Responsibilities

### Model Selection & Deployment
- Select and evaluate pretrained phishing detection models
- Optimize model for Lambda deployment (size, inference speed)
- Deploy model to S3 for Lambda access
- Implement model versioning and updates

### Inference Implementation
- Create Lambda function for model inference
- Optimize cold start performance
- Implement confidence scoring (0.0 to 1.0 risk score)
- Provide fallback rule-based detection

### Model Management
- Track model versions in database
- Monitor accuracy and performance metrics
- Implement A/B testing for model updates
- Handle model update deployment (blue-green)

## Integration Interface

### Input Format (from Backend API)

The ML engine receives URL analysis requests from the backend:

```typescript
interface AnalysisRequest {
  url: string;              // Full URL to analyze
  domain: string;           // Extracted domain
  metadata?: {              // Optional context
    referrer?: string;
    userAgent?: string;
    pageContent?: string;   // If available from extension
  };
}
```

### Output Format (to Backend API)

The ML engine returns structured risk assessment:

```typescript
interface MLResponse {
  riskScore: number;        // 0.0 (safe) to 1.0 (dangerous)
  threats: {
    phishing: number;       // Probability of phishing
    malware: number;        // Probability of malware
    social: number;         // Social engineering score
  };
  confidence: number;       // Model confidence (0.0 to 1.0)
  source: string;          // "ml" | "rule_based" | "fallback"
  modelVersion: string;     // e.g., "v1.2.0"
  processingTime: number;   // Inference time in ms
}
```

### Error Handling

If ML inference fails, return fallback response:

```typescript
{
  riskScore: 0.5,           // Neutral score
  threats: { phishing: 0.5, malware: 0.5, social: 0.5 },
  confidence: 0.0,
  source: "fallback",
  modelVersion: "fallback",
  processingTime: 0,
  error: "Model inference failed"
}
```

## Integration Points

### 1. Lambda Endpoint

**Function Name:** `pufferphish-ml-analyze`

**Invocation Pattern:**
```typescript
// Backend invokes ML Lambda
const result = await lambda.invoke({
  FunctionName: 'pufferphish-ml-analyze',
  Payload: JSON.stringify({
    url: 'https://example.com',
    domain: 'example.com'
  })
});

const mlResponse = JSON.parse(result.Payload);
```

### 2. S3 Model Storage

**Bucket Structure:**
```
pufferphish-ml-models/
├── models/
│   ├── v1.0.0/
│   │   ├── model.bin
│   │   ├── config.json
│   │   └── metadata.json
│   ├── v1.1.0/
│   └── latest/          # Symlink to current version
└── rules/
    └── fallback-rules.json
```

### 3. Database Integration

**ModelVersion Table:**
```typescript
{
  id: string;
  version: string;        // "v1.2.0"
  s3Path: string;        // "models/v1.2.0/"
  accuracy: number;       // 0.85
  deployedAt: DateTime;
  active: boolean;        // Currently in use
  metadata: {
    framework: "transformers",
    baseModel: "distilbert-base-uncased",
    trainingData: "phishing-dataset-v2",
    parameters: 66_000_000
  }
}
```

## Technical Requirements

### Performance Targets
- **Inference Time:** <500ms (p95)
- **Cold Start:** <3s (Lambda cold start)
- **Memory:** 512MB - 3GB Lambda memory
- **Accuracy:** >80% on test dataset

### Model Constraints
- **Size:** <250MB (for Lambda deployment)
- **Format:** ONNX, TensorFlow Lite, or PyTorch (compatible with Lambda)
- **Dependencies:** Minimize package size for faster cold starts

### Fallback Rules

When ML inference fails or confidence is low, use rule-based detection:

```typescript
const fallbackRules = {
  // Suspicious patterns
  suspiciousPatterns: [
    /paypal.*verify/i,
    /account.*suspended/i,
    /urgent.*action/i,
    /confirm.*identity/i
  ],

  // Known safe domains (whitelist)
  safeDomains: [
    'google.com',
    'github.com',
    'stackoverflow.com'
  ],

  // High-risk TLDs
  riskyTLDs: ['.tk', '.ml', '.ga', '.cf', '.gq'],

  // URL characteristics
  checks: {
    excessiveDashes: (url) => url.split('-').length > 4,
    ipAddress: (url) => /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url),
    longSubdomain: (url) => url.split('.').length > 4,
    suspiciousPort: (url) => /:(8080|8888|3000|4444)/.test(url)
  }
};
```

## Development Setup

### Local Testing

```bash
# Install dependencies
cd packages/ml-engine
pip install -r requirements.txt

# Download model
python scripts/download_model.py

# Test inference locally
python scripts/test_inference.py --url "https://example.com"

# Benchmark performance
python scripts/benchmark.py
```

### Model Evaluation

```python
# Evaluate model accuracy
from ml_engine import evaluate

results = evaluate.test_model(
    model_path='models/v1.0.0/',
    test_dataset='data/test.jsonl'
)

print(f"Accuracy: {results.accuracy}")
print(f"Precision: {results.precision}")
print(f"Recall: {results.recall}")
print(f"F1 Score: {results.f1}")
```

## Deployment Process

### 1. Model Upload to S3
```bash
# Package model
python scripts/package_model.py --version v1.2.0

# Upload to S3
aws s3 sync ./dist/v1.2.0/ s3://pufferphish-ml-models/models/v1.2.0/
```

### 2. Lambda Deployment
```bash
# Build Lambda package
npm run build --workspace=packages/ml-engine

# Deploy via CDK
cd infrastructure
npm run cdk deploy MlStack
```

### 3. Version Activation
```typescript
// Update database to mark new version as active
await prisma.modelVersion.updateMany({
  where: { active: true },
  data: { active: false }
});

await prisma.modelVersion.update({
  where: { version: 'v1.2.0' },
  data: { active: true }
});
```

## Monitoring & Metrics

### CloudWatch Metrics
- **Invocations:** Total ML Lambda invocations
- **Duration:** Inference time distribution
- **Errors:** Failed inference attempts
- **Throttles:** Rate limiting events

### Custom Metrics
- **Accuracy Tracking:** Compare predictions with user feedback
- **Confidence Distribution:** Track model confidence scores
- **Fallback Rate:** How often rule-based detection is used
- **Model Version Usage:** Track active model versions

### Logging
```typescript
// Structured logging for analysis
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  type: 'ml_inference',
  url: analyzedUrl,
  riskScore: result.riskScore,
  confidence: result.confidence,
  source: result.source,
  modelVersion: result.modelVersion,
  processingTime: result.processingTime
}));
```

## Feedback Loop

### User Feedback Integration

When users report false positives/negatives:

```typescript
// Feedback stored in database
interface Feedback {
  analysisId: string;
  correct: boolean;       // Was our prediction correct?
  actualThreat: string;   // "none" | "phishing" | "malware"
  comment?: string;
}

// ML team can query feedback for model improvement
const feedback = await prisma.feedback.findMany({
  where: {
    analysis: {
      source: 'ml',
      modelVersion: 'v1.2.0'
    }
  },
  include: { analysis: true }
});
```

### Model Retraining

Periodically use feedback to improve model:
1. Export feedback data from database
2. Label and prepare training data
3. Retrain or fine-tune model
4. Evaluate on test set
5. Deploy new version if accuracy improves

## Testing Requirements

### Unit Tests
- Model loading and initialization
- Inference correctness
- Fallback rule logic
- Error handling

### Integration Tests
- Lambda invocation from backend
- S3 model loading
- Database version queries

### Performance Tests
- Cold start benchmarks
- Inference speed under load
- Memory usage profiling

## API Contract Validation

Before deploying any changes, validate integration:

```typescript
// Test that ML Lambda returns expected format
const response = await invokeMlLambda({
  url: 'https://test.com'
});

assert(response.riskScore >= 0 && response.riskScore <= 1);
assert(response.threats.phishing !== undefined);
assert(response.confidence >= 0 && response.confidence <= 1);
assert(['ml', 'rule_based', 'fallback'].includes(response.source));
```

## Support & Communication

### Documentation Requirements
- README in `/packages/ml-engine/` with setup instructions
- Model performance benchmarks and accuracy reports
- API contract documentation (keep updated)

### Integration Support
- Provide test endpoints for backend team validation
- Document any API changes in advance
- Participate in integration testing sessions

### Escalation
- Model performance issues → Notify backend team
- Infrastructure needs → Coordinate with backend team
- Accuracy concerns → Share feedback analysis
