# CDK Setup Guide

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed (`brew install awscli` on macOS)
3. Node.js 20+ installed

## Initial Setup

### 1. Configure AWS Credentials

```bash
aws configure
```

Enter:
- AWS Access Key ID (from IAM user)
- AWS Secret Access Key (from IAM user)
- Default region: `us-east-1`
- Output format: `json`

### 2. Bootstrap CDK

First-time setup for your AWS account:

```bash
# Get your AWS account ID
aws sts get-caller-identity --query Account --output text

# Bootstrap CDK (replace 123456789012 with your account ID)
cd infrastructure
npx cdk bootstrap aws://123456789012/us-east-1
```

This creates:
- S3 bucket for CDK assets
- IAM roles for deployment
- CloudFormation stack for CDK operations

## Deployment Commands

```bash
cd infrastructure

# Preview changes without deploying
npx cdk diff

# Deploy stack to AWS
npx cdk deploy

# Deploy without confirmation prompts
npx cdk deploy --require-approval never

# List all stacks
npx cdk list

# Destroy all resources
npx cdk destroy
```

## How CDK Works

1. **Define Infrastructure**: Write TypeScript code in `lib/pufferphish-stack.ts`
2. **Synthesize**: CDK converts code to CloudFormation templates
3. **Deploy**: CloudFormation creates AWS resources

## Adding Resources

Example additions to `pufferphish-stack.ts`:

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';

// S3 bucket for dashboard
const bucket = new s3.Bucket(this, 'DashboardBucket', {
  websiteIndexDocument: 'index.html',
  publicReadAccess: true
});

// Lambda function for API
const apiFunction = new lambda.Function(this, 'ApiFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  code: lambda.Code.fromAsset('../packages/api/dist'),
  handler: 'index.handler'
});
```

## GitHub Actions Integration

The deploy workflow automatically:
1. Builds all packages
2. Configures AWS credentials from GitHub Secrets
3. Deploys infrastructure with CDK
4. Uploads dashboard to S3
5. Creates Chrome extension artifact

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`
- `S3_BUCKET_NAME` (after first deployment)
- `CLOUDFRONT_DISTRIBUTION_ID` (after first deployment)

## Troubleshooting

### "Has the environment been bootstrapped?"
Run: `npx cdk bootstrap aws://ACCOUNT_ID/us-east-1`

### "Credentials could not be used to assume role"
Check AWS credentials with: `aws sts get-caller-identity`

### "Stack already exists"
Either update existing stack with `cdk deploy` or delete with `cdk destroy`

## Cost Considerations

Free tier covers:
- Lambda: 1M requests/month
- S3: 5GB storage
- CloudFront: 1TB data transfer
- RDS: 750 hours db.t3.micro

Monitor costs at: https://console.aws.amazon.com/billing/