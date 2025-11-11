#!/bin/bash

# Backend Team Setup Script
# Sets up development environment for backend API and infrastructure

set -e

echo "⚙️  Setting up Backend Team Development Environment"
echo "==================================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from nodejs.org" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required. Install with Node.js" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required. Install: brew install awscli" >&2; exit 1; }

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version 18+ recommended (you have $(node --version))"
fi

echo "✅ Prerequisites check passed"
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "✅ AWS credentials configured (Account: $ACCOUNT_ID)"
else
    echo "⚠️  AWS credentials not configured"
    echo "   Run: aws configure"
    echo "   You'll need: Access Key ID, Secret Access Key, Region"
fi

echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Setup database package
echo "Setting up database package..."
cd packages/database

if [ ! -f ".env" ]; then
    echo "⚠️  Database .env not found"
    echo "   Create .env with: DATABASE_URL=your-supabase-connection-string"
    echo "   See: docs/implementation-plan.md for Supabase setup"
else
    echo "✅ Database .env found"

    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate

    echo "✅ Prisma client generated"
fi

cd ../..

# Setup infrastructure
echo "Setting up infrastructure (CDK)..."
cd infrastructure
npm install

# Check if CDK is bootstrapped
if aws cloudformation describe-stacks --stack-name CDKToolkit > /dev/null 2>&1; then
    echo "✅ CDK already bootstrapped"
else
    echo "⚠️  CDK not bootstrapped"
    echo "   Run: npx cdk bootstrap"
    echo "   (This is a one-time setup per AWS account/region)"
fi

cd ..

# Setup API package
echo "Setting up API package..."
cd packages/api
npm install
cd ../..

# Setup dashboard package
echo "Setting up dashboard package..."
cd packages/dashboard
npm install
cd ../..

echo ""
echo "✅ Backend Team setup complete!"
echo ""
echo "📚 Documentation:"
echo "   - Implementation guide: docs/03-backend-implementation.md"
echo "   - Step-by-step plan: docs/implementation-plan.md"
echo "   - Security requirements: docs/security/03-backend-security.md"
echo "   - GitHub Actions guide: docs/github-actions-guide.md"
echo ""
echo "🗄️  Database (Supabase):"
echo "   - Status: $([ -f packages/database/.env ] && echo '✅ Configured' || echo '⚠️  Not configured')"
echo "   - Push schema: npm run db:push"
echo "   - Open studio: npm run db:studio"
echo ""
echo "☁️  AWS Infrastructure:"
echo "   - CDK status: $(aws cloudformation describe-stacks --stack-name CDKToolkit > /dev/null 2>&1 && echo '✅ Bootstrapped' || echo '⚠️  Not bootstrapped')"
echo "   - Deploy: cd infrastructure && npx cdk deploy"
echo ""
echo "🚀 Next steps:"
echo "   1. Complete Supabase setup (if not done)"
echo "   2. Bootstrap CDK (if needed): cd infrastructure && npx cdk bootstrap"
echo "   3. Deploy infrastructure: cd infrastructure && npx cdk deploy"
echo "   4. Set up Vercel for dashboard deployment"
echo "   5. Configure GitHub Actions secrets"
echo ""
