#!/bin/bash

# Setup GitHub Secrets for PufferPhish
# This script configures GitHub repository secrets needed for CI/CD

set -e

echo "Setting up GitHub Secrets for PufferPhish"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please create .env from .env.example first"
    exit 1
fi

# Load values from .env
export $(cat .env | grep -v '^#' | xargs)

# Check if repo exists on GitHub
REPO_NAME=$(basename $(pwd))
if ! gh repo view &> /dev/null; then
    echo "GitHub repository not found locally."
    echo "Would you like to create it? (y/n)"
    read -r CREATE_REPO
    
    if [ "$CREATE_REPO" = "y" ]; then
        echo "Creating private repository on GitHub..."
        gh repo create $REPO_NAME --private --source=. --description "Anti-phishing Chrome extension with ML detection"
        echo "Repository created successfully!"
    else
        echo "Please create the repository first:"
        echo "  gh repo create $REPO_NAME --private --source=."
        exit 1
    fi
fi

echo ""
echo "Setting GitHub Secrets from .env file..."
echo ""

# Set required secrets
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "⚠️  Warning: AWS_ACCESS_KEY_ID is empty in .env file"
else
    echo "Setting AWS_ACCESS_KEY_ID..."
    echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID
    echo "✅ AWS_ACCESS_KEY_ID set successfully"
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  Warning: AWS_SECRET_ACCESS_KEY is empty in .env file"
else
    echo "Setting AWS_SECRET_ACCESS_KEY..."
    echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY
    echo "✅ AWS_SECRET_ACCESS_KEY set successfully"
fi

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "⚠️  Warning: AWS_ACCOUNT_ID is empty in .env file"
else
    echo "Setting AWS_ACCOUNT_ID..."
    echo "$AWS_ACCOUNT_ID" | gh secret set AWS_ACCOUNT_ID
    echo "✅ AWS_ACCOUNT_ID set successfully"
fi

echo ""
echo "Optional secrets (to be set after infrastructure deployment):"
echo "  - SNYK_TOKEN"
echo "  - S3_BUCKET_NAME"
echo "  - CLOUDFRONT_DISTRIBUTION_ID"

echo ""
echo "Verifying secrets..."
gh secret list

echo ""
echo "✅ GitHub Secrets setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy infrastructure with: npm run deploy:dev"
echo "2. Update these secrets after deployment:"
echo "   - S3_BUCKET_NAME (from CDK output)"
echo "   - CLOUDFRONT_DISTRIBUTION_ID (from CDK output)"
echo "3. Optional: Add SNYK_TOKEN for security scanning"
echo ""
echo "To update a secret later:"
echo "  gh secret set SECRET_NAME --body 'value'"