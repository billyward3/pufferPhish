import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class PufferPhishStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for Dashboard Hosting
    const dashboardBucket = new s3.Bucket(this, 'DashboardBucket', {
      bucketName: `pufferphish-dashboard-${this.account}-${this.region}`,
      publicReadAccess: false, // CloudFront will handle access via OAC
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Fully private, OAC handles access
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN for production
      autoDeleteObjects: true, // For development - remove for production
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3600
      }]
    });

    // CloudFront Distribution for Dashboard
    const distribution = new cloudfront.Distribution(this, 'DashboardDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(dashboardBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0)
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0)
        }
      ],
      comment: 'PufferPhish Dashboard Distribution',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100 // Use only North America and Europe edge locations to reduce costs
    });

    // Output values for GitHub Actions and reference
    new cdk.CfnOutput(this, 'DashboardBucketName', {
      value: dashboardBucket.bucketName,
      description: 'S3 bucket name for dashboard deployment',
      exportName: 'PufferPhishDashboardBucket'
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID for cache invalidation',
      exportName: 'PufferPhishCloudFrontId'
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Dashboard URL',
      exportName: 'PufferPhishDashboardUrl'
    });
  }
}