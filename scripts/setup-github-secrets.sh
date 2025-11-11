#!/bin/bash

# Setup GitHub Secrets for PufferPhish
# Configures all required secrets for CI/CD workflows

set -e

echo "🔐 Setting up GitHub Secrets for PufferPhish"
echo "============================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "   Install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check if repo exists on GitHub
if ! gh repo view &> /dev/null; then
    echo "❌ GitHub repository not found"
    echo "   Make sure you've pushed to GitHub first"
    exit 1
fi

REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO_NAME"
echo ""

# Function to set secret
set_secret() {
    local name=$1
    local value=$2
    local required=$3

    if [ -z "$value" ]; then
        if [ "$required" = "true" ]; then
            echo "⚠️  Warning: $name is empty but marked as required"
            return 1
        else
            echo "⏭️  Skipping optional secret: $name"
            return 0
        fi
    fi

    echo "Setting $name..."
    echo "$value" | gh secret set "$name" 2>&1 | grep -v "✓" || true
    echo "✅ $name set"
}

echo "This script will set up all required secrets for GitHub Actions."
echo "You'll be prompted to enter values for each secret."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# AWS Secrets
echo ""
echo "=========================================="
echo "AWS Credentials (Required for Backend/ML)"
echo "=========================================="
echo ""

echo "Enter AWS_ACCESS_KEY_ID:"
read -r AWS_ACCESS_KEY_ID
set_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "true"

echo "Enter AWS_SECRET_ACCESS_KEY:"
read -rs AWS_SECRET_ACCESS_KEY
echo ""
set_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "true"

echo "Enter AWS_REGION (e.g., us-east-1):"
read -r AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}
set_secret "AWS_REGION" "$AWS_REGION" "true"

# Database Secret
echo ""
echo "========================================"
echo "Database (Required for Backend)"
echo "========================================"
echo ""

echo "Enter DATABASE_URL (Supabase connection string):"
echo "Format: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
read -r DATABASE_URL
set_secret "DATABASE_URL" "$DATABASE_URL" "true"

# Vercel Secrets
echo ""
echo "========================================"
echo "Vercel (Required for Dashboard)"
echo "========================================"
echo ""
echo "Get these from: vercel.com/account/tokens and .vercel/project.json"
echo ""

echo "Enter VERCEL_TOKEN (from vercel.com/account/tokens):"
read -rs VERCEL_TOKEN
echo ""
set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" "true"

echo "Enter VERCEL_ORG_ID (from .vercel/project.json):"
read -r VERCEL_ORG_ID
set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID" "true"

echo "Enter VERCEL_PROJECT_ID (from .vercel/project.json):"
read -r VERCEL_PROJECT_ID
set_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID" "true"

# API Secrets (for Dashboard build)
echo ""
echo "========================================"
echo "API Configuration (Required for Dashboard)"
echo "========================================"
echo ""
echo "These are set after infrastructure deployment"
echo ""

echo "Enter API_URL (API Gateway URL after deployment):"
echo "(Leave empty if not deployed yet)"
read -r API_URL
set_secret "API_URL" "$API_URL" "false"

# Supabase Secrets (for Dashboard)
echo ""
echo "========================================"
echo "Supabase (Required for Dashboard)"
echo "========================================"
echo ""

echo "Enter SUPABASE_URL (from Supabase dashboard):"
read -r SUPABASE_URL
set_secret "SUPABASE_URL" "$SUPABASE_URL" "false"

echo "Enter SUPABASE_ANON_KEY (from Supabase dashboard):"
read -r SUPABASE_ANON_KEY
set_secret "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "false"

# Cognito Secrets (alternative to Supabase Auth)
echo ""
echo "========================================"
echo "Cognito (Alternative to Supabase Auth)"
echo "========================================"
echo ""
echo "Only needed if using Cognito instead of Supabase Auth"
echo ""

echo "Enter COGNITO_USER_POOL_ID (leave empty if using Supabase Auth):"
read -r COGNITO_USER_POOL_ID
set_secret "COGNITO_USER_POOL_ID" "$COGNITO_USER_POOL_ID" "false"

echo "Enter COGNITO_USER_POOL_CLIENT_ID (leave empty if using Supabase Auth):"
read -r COGNITO_USER_POOL_CLIENT_ID
set_secret "COGNITO_USER_POOL_CLIENT_ID" "$COGNITO_USER_POOL_CLIENT_ID" "false"

echo ""
echo "========================================"
echo "Verifying secrets..."
echo "========================================"
echo ""

gh secret list

echo ""
echo "✅ GitHub Secrets setup complete!"
echo ""
echo "📝 Secrets configured:"
echo "   ✅ AWS credentials (for Lambda deployment)"
echo "   ✅ Database URL (for API)"
echo "   ✅ Vercel configuration (for dashboard)"
echo "   $([ -n "$API_URL" ] && echo '✅' || echo '⏭️') API URL (update after deployment)"
echo "   $([ -n "$SUPABASE_URL" ] && echo '✅' || echo '⏭️') Supabase configuration"
echo ""
echo "🚀 Next steps:"
echo "   1. Deploy infrastructure: cd infrastructure && npx cdk deploy"
echo "   2. Update API_URL secret with deployed API Gateway URL:"
echo "      gh secret set API_URL --body 'your-api-gateway-url'"
echo "   3. Test GitHub Actions workflows:"
echo "      - Push to main/billy-dev triggers CI"
echo "      - Manual deployment via Actions tab"
echo ""
echo "📚 See: docs/github-actions-guide.md for detailed usage"
echo ""
