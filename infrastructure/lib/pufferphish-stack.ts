import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class PufferPhishStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Placeholder stack - infrastructure will be added incrementally
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Name of the deployed stack'
    });
  }
}