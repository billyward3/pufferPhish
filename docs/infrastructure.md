# Infrastructure & Deployment

## AWS Services Overview

### Core Services
- **Lambda:** Serverless compute for API endpoints
- **API Gateway HTTP:** API routing and authorization
- **RDS PostgreSQL:** Relational database
- **S3:** Static website hosting and model storage
- **CloudFront:** CDN for dashboard
- **Cognito:** User authentication and management

### Supporting Services
- **CloudWatch:** Logging and monitoring
- **X-Ray:** Distributed tracing
- **Secrets Manager:** Secure credential storage
- **IAM:** Access control and permissions

## AWS CDK Structure

### Stack Organization
```typescript
// infrastructure/bin/app.ts
const app = new cdk.App();

new AuthStack(app, 'PufferPhishAuth');
new DatabaseStack(app, 'PufferPhishDatabase');
new ApiStack(app, 'PufferPhishApi');
new FrontendStack(app, 'PufferPhishFrontend');
new MonitoringStack(app, 'PufferPhishMonitoring');
```

### Stack Dependencies
```typescript
// API Stack depends on Auth and Database
const apiStack = new ApiStack(app, 'Api', {
  userPool: authStack.userPool,
  database: databaseStack.database,
});
```

## Cost Management

### Estimated Costs

#### Development Environment
```yaml
Monthly Costs:
  Lambda: $0 (free tier)
  API Gateway: $0-1
  RDS t3.micro: $0 (free tier year 1)
  S3: $1-2
  CloudFront: $1-2
  Cognito: $0
  Total: $2-5/month
```

#### Production Environment
```yaml
Monthly Costs (100-1000 users):
  Lambda: $5-10
  API Gateway: $5-10
  RDS t3.small: $15
  S3: $5
  CloudFront: $5-10
  Cognito: $0-10
  Total: $35-60/month
```

### Cost Controls

#### Budget Alerts
```typescript
new budgets.CfnBudget(this, 'MonthlyBudget', {
  budget: {
    budgetLimit: { amount: 20, unit: 'USD' },
    timeUnit: 'MONTHLY',
    budgetType: 'COST',
  },
  notificationsWithSubscribers: [{
    notification: {
      notificationType: 'ACTUAL',
      comparisonOperator: 'GREATER_THAN',
      threshold: 80,
    },
    subscribers: [{ 
      subscriptionType: 'EMAIL',
      address: 'team@example.com',
    }],
  }],
});
```

#### Auto-Shutdown for Dev
```typescript
// Shutdown non-production resources at night
new events.Rule(this, 'NightlyShutdown', {
  schedule: events.Schedule.cron({ 
    hour: '2',
    minute: '0',
  }),
  targets: [
    new targets.LambdaFunction(shutdownFunction),
  ],
});
```

## Deployment Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test
      
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd infrastructure
          npm run cdk deploy --all --require-approval never
```

### Deployment Environments

#### Development
- Branch: `develop`
- URL: `https://dev.pufferphish.com`
- Database: Shared dev RDS
- Auto-deploy on push

#### Staging
- Branch: `staging`
- URL: `https://staging.pufferphish.com`
- Database: Separate staging RDS
- Manual approval required

#### Production
- Branch: `main`
- URL: `https://pufferphish.com`
- Database: Production RDS with backups
- Manual deployment with approval

## CDK Commands

### Common Commands
```bash
# List all stacks
npm run cdk list

# Show stack differences
npm run cdk diff

# Deploy specific stack
npm run cdk deploy ApiStack

# Deploy all stacks
npm run cdk deploy --all

# Destroy stack (careful!)
npm run cdk destroy ApiStack
```

### Stack Outputs
```bash
# After deployment, save these outputs:
PufferPhishAuth.UserPoolId = us-east-1_xxxxx
PufferPhishAuth.UserPoolClientId = xxxxx
PufferPhishApi.ApiUrl = https://xxx.execute-api.region.amazonaws.com
PufferPhishFrontend.CloudFrontUrl = https://xxx.cloudfront.net
PufferPhishDatabase.DbEndpoint = xxx.rds.amazonaws.com
```

## Security Configuration

### IAM Policies

#### Lambda Execution Role
```typescript
const lambdaRole = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
  inlinePolicies: {
    DatabaseAccess: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['rds:DescribeDBInstances'],
          resources: ['*'],
        }),
      ],
    }),
  },
});
```

#### S3 Bucket Policy
```typescript
const bucket = new s3.Bucket(this, 'DashboardBucket', {
  publicReadAccess: false,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  versioned: true,
});
```

### Network Security

#### VPC Configuration
```typescript
const vpc = new ec2.Vpc(this, 'VPC', {
  maxAzs: 2,
  natGateways: 1,
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
  ],
});
```

#### Security Groups
```typescript
const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
  vpc,
  description: 'Security group for RDS',
  allowAllOutbound: false,
});

dbSecurityGroup.addIngressRule(
  lambdaSecurityGroup,
  ec2.Port.tcp(5432),
  'Allow Lambda to connect to RDS'
);
```

## Monitoring & Logging

### CloudWatch Dashboards
```typescript
const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
  dashboardName: 'pufferphish-metrics',
});

dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'API Latency',
    left: [apiGateway.metricLatency()],
  }),
  new cloudwatch.GraphWidget({
    title: 'Lambda Errors',
    left: [lambdaFunction.metricErrors()],
  }),
);
```

### Alarms
```typescript
new cloudwatch.Alarm(this, 'HighLatency', {
  metric: apiGateway.metricLatency({
    statistic: 'Average',
  }),
  threshold: 1000, // 1 second
  evaluationPeriods: 2,
  alarmDescription: 'API latency is too high',
});
```

### Log Retention
```typescript
new logs.LogGroup(this, 'ApiLogGroup', {
  logGroupName: '/aws/lambda/pufferphish-api',
  retention: logs.RetentionDays.ONE_WEEK, // Save costs
});
```

## Scaling Configuration

### Lambda Concurrency
```typescript
const lambdaFunction = new lambda.Function(this, 'ApiFunction', {
  // ... other config
  reservedConcurrentExecutions: 100, // Limit concurrent executions
});
```

### RDS Scaling
```typescript
const database = new rds.DatabaseInstance(this, 'Database', {
  // Start small
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MICRO
  ),
  // Enable storage autoscaling
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
});
```

### API Gateway Throttling
```typescript
const api = new apigateway.HttpApi(this, 'Api', {
  throttle: {
    rateLimit: 100, // requests per second
    burstLimit: 200,
  },
});
```

## Backup & Recovery

### RDS Backups
```typescript
const database = new rds.DatabaseInstance(this, 'Database', {
  backupRetention: cdk.Duration.days(7),
  preferredBackupWindow: '03:00-04:00',
  deletionProtection: true, // Prevent accidental deletion
});
```

### S3 Versioning
```typescript
const bucket = new s3.Bucket(this, 'ModelBucket', {
  versioned: true,
  lifecycleRules: [{
    noncurrentVersionExpiration: cdk.Duration.days(30),
  }],
});
```

## Troubleshooting Deployment

### CDK Bootstrap Issues
```bash
# Re-bootstrap
npm run cdk bootstrap --force

# Check bootstrap version
aws cloudformation describe-stacks \
  --stack-name CDKToolkit \
  --query "Stacks[0].Outputs"
```

### Stack Rollback
```bash
# Continue after failed deployment
aws cloudformation continue-update-rollback \
  --stack-name PufferPhishApi

# Delete failed stack
aws cloudformation delete-stack \
  --stack-name PufferPhishApi
```

### Resource Limits
```bash
# Check CloudFormation limits
aws service-quotas get-service-quota \
  --service-code cloudformation \
  --quota-code L-1216C47A

# Check Lambda limits
aws service-quotas get-service-quota \
  --service-code lambda \
  --quota-code L-B99A9384
```