import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as path from 'path';

export class PufferPhishStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // S3 Bucket for ML Models
    // ============================================
    const modelBucket = new s3.Bucket(this, 'ModelBucket', {
      bucketName: `pufferphish-ml-models-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep models even if stack is deleted
      versioned: true, // Enable versioning for model updates
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // ============================================
    // Cognito User Pool (Optional - can use Supabase Auth instead)
    // ============================================
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'pufferphish-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false, // No secret for web/mobile clients
    });

    // ============================================
    // Lambda Layer for Shared Dependencies
    // ============================================
    // Note: Prisma Client and other dependencies should be in a layer
    // For MVP, we'll bundle them with each function

    // ============================================
    // Lambda Functions for Backend API
    // ============================================

    // Shared Lambda configuration
    const lambdaEnvironment = {
      DATABASE_URL: process.env.DATABASE_URL || '',
      NODE_ENV: process.env.NODE_ENV || 'production',
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
    };

    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      bundling: {
        minify: false, // Disable for easier debugging in MVP
        sourceMap: true,
        externalModules: ['@aws-sdk/*'], // AWS SDK is available in Lambda runtime
      },
    };

    // Analyze Lambda - URL phishing analysis
    const analyzeLambda = new lambda.Function(this, 'AnalyzeFunction', {
      ...lambdaProps,
      functionName: 'pufferphish-analyze',
      description: 'Analyze URLs for phishing threats',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/api')),
      handler: 'dist/handlers/analyze.handler',
    });

    // Stats Lambda - User statistics
    const statsLambda = new lambda.Function(this, 'StatsFunction', {
      ...lambdaProps,
      functionName: 'pufferphish-stats',
      description: 'Retrieve user statistics',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/api')),
      handler: 'dist/handlers/stats.handler',
    });

    // Settings Lambda - User settings CRUD
    const settingsLambda = new lambda.Function(this, 'SettingsFunction', {
      ...lambdaProps,
      functionName: 'pufferphish-settings',
      description: 'Manage user settings',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/api')),
      handler: 'dist/handlers/settings.handler',
    });

    // Feedback Lambda - User feedback submission
    const feedbackLambda = new lambda.Function(this, 'FeedbackFunction', {
      ...lambdaProps,
      functionName: 'pufferphish-feedback',
      description: 'Submit user feedback',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/api')),
      handler: 'dist/handlers/feedback.handler',
    });

    // ML Lambda - Phishing detection model (Python)
    const mlLambda = new lambda.Function(this, 'MLFunction', {
      functionName: 'pufferphish-ml-analyze',
      description: 'ML model inference for phishing detection',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'src.index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/ml-engine')),
      timeout: cdk.Duration.seconds(60), // ML inference may take longer
      memorySize: 1024, // More memory for ML workload
      environment: {
        MODEL_BUCKET: modelBucket.bucketName,
        MODEL_PATH: 'models/phishing-detector/latest',
      },
    });

    // Grant ML Lambda access to read from model bucket
    modelBucket.grantRead(mlLambda);

    // Grant analyze Lambda permission to invoke ML Lambda
    analyzeLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [mlLambda.functionArn],
    }));

    // ============================================
    // API Gateway (HTTP API)
    // ============================================
    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: 'pufferphish-api',
      description: 'PufferPhish Backend API',
      corsPreflight: {
        allowOrigins: ['*'], // TODO: Restrict to dashboard and extension domains in production
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Lambda integrations
    const analyzeLambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'AnalyzeLambdaIntegration',
      analyzeLambda
    );

    const statsLambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'StatsLambdaIntegration',
      statsLambda
    );

    const settingsLambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'SettingsLambdaIntegration',
      settingsLambda
    );

    const feedbackLambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'FeedbackLambdaIntegration',
      feedbackLambda
    );

    // API Routes
    httpApi.addRoutes({
      path: '/analyze',
      methods: [apigateway.HttpMethod.POST],
      integration: analyzeLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/stats',
      methods: [apigateway.HttpMethod.GET],
      integration: statsLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/settings',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT],
      integration: settingsLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/feedback',
      methods: [apigateway.HttpMethod.POST],
      integration: feedbackLambdaIntegration,
    });

    // ============================================
    // CloudFormation Outputs
    // ============================================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway endpoint URL',
      exportName: 'PufferPhishApiUrl',
    });

    new cdk.CfnOutput(this, 'ModelBucketName', {
      value: modelBucket.bucketName,
      description: 'S3 bucket for ML models',
      exportName: 'PufferPhishModelBucket',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'PufferPhishUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'PufferPhishUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'MLLambdaArn', {
      value: mlLambda.functionArn,
      description: 'ML Lambda function ARN',
      exportName: 'PufferPhishMLLambdaArn',
    });

    new cdk.CfnOutput(this, 'AnalyzeLambdaName', {
      value: analyzeLambda.functionName,
      description: 'Analyze Lambda function name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
