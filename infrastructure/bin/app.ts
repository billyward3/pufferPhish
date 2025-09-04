#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PufferPhishStack } from '../lib/pufferphish-stack';

const app = new cdk.App();

new PufferPhishStack(app, 'PufferPhishStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'PufferPhish anti-phishing system infrastructure'
});

app.synth();