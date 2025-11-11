# GitHub Actions Guide

## Overview

PufferPhish uses GitHub Actions for continuous integration (CI) and deployment. The workflows are designed to match the 3-part component structure and hybrid deployment strategy.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `billy-dev` branches
- Pull requests to `main`

**Jobs:**
- **Lint & Type Check:** ESLint and TypeScript validation
- **Security Audit:** npm audit for vulnerabilities
- **Test Backend:** Runs API tests (if they exist)
- **Test Extension:** Builds and tests extension (if it exists)
- **Validate Docs:** Checks for broken links in markdown
- **Summary:** Aggregates all job results

**Key Features:**
- Runs on every push/PR automatically
- Uses `--if-present` to gracefully handle missing scripts
- Uses `continue-on-error: true` to not block on warnings
- Checks if packages exist before running tests
- Validates documentation structure

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**
- Manual only (workflow_dispatch)
- Choose component to deploy: all, backend-api, ml-lambda, dashboard, extension
- Choose environment: development or production

**Jobs:**
- **Deploy Backend:** AWS Lambda via CDK (ApiStack)
- **Deploy ML:** ML Lambda via CDK (MlStack)
- **Deploy Dashboard:** Vercel deployment
- **Package Extension:** Builds and zips extension for Chrome Web Store

**Key Features:**
- Selective deployment (deploy only what changed)
- Environment-specific configuration
- Gracefully skips missing packages
- Uploads extension as artifact for manual submission

## Required Secrets

To use these workflows, configure the following secrets in GitHub:
**Settings → Secrets and variables → Actions**

### AWS Secrets (Required for Backend & ML)

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalr...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `DATABASE_URL` | Supabase connection string | `postgresql://...` |

### Vercel Secrets (Required for Dashboard)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID | `vercel link` command output |
| `VERCEL_PROJECT_ID` | Vercel project ID | `vercel link` command output |

### API Secrets (For Dashboard Build)

| Secret | Description |
|--------|-------------|
| `API_URL` | API Gateway URL after deployment |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID (if using Cognito) |
| `COGNITO_USER_POOL_CLIENT_ID` | Cognito Client ID (if using Cognito) |

## Setup Instructions

### 1. Configure AWS Credentials

```bash
# Create IAM user for GitHub Actions
aws iam create-user --user-name github-actions-pufferphish

# Attach necessary policies
aws iam attach-user-policy \
  --user-name github-actions-pufferphish \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access key
aws iam create-access-key --user-name github-actions-pufferphish
# Save the AccessKeyId and SecretAccessKey
```

Add to GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### 2. Configure Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (run in packages/dashboard)
cd packages/dashboard
vercel link

# Get tokens from output
# Copy .vercel/project.json values
```

Add to GitHub Secrets:
- `VERCEL_TOKEN` - Generate at https://vercel.com/account/tokens
- `VERCEL_ORG_ID` - From `.vercel/project.json`
- `VERCEL_PROJECT_ID` - From `.vercel/project.json`

### 3. Configure Database

Add to GitHub Secrets:
- `DATABASE_URL` - Your Supabase connection string

Format:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

## Using the Workflows

### Running CI

CI runs automatically on every push and PR. To see results:
1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. View job summaries and logs

### Manual Deployment

1. Go to **Actions** tab
2. Click **Deploy** workflow
3. Click **Run workflow**
4. Select:
   - Component to deploy (or "all")
   - Environment (development or production)
5. Click **Run workflow**

**Example Deployment Scenarios:**

**Deploy only backend after API changes:**
```
Component: backend-api
Environment: development
```

**Deploy everything for first time:**
```
Component: all
Environment: development
```

**Deploy dashboard after UI updates:**
```
Component: dashboard
Environment: development
```

**Package extension for Chrome Web Store:**
```
Component: extension
Environment: production
```

### Downloading Extension Artifact

After running extension packaging:
1. Go to workflow run
2. Scroll to **Artifacts** section at bottom
3. Download `pufferphish-extension-{environment}.zip`
4. Submit to Chrome Web Store

## Workflow Status

### View Workflow Status

**In PRs:**
- Status checks appear at bottom of PR
- Green check = passed
- Red X = failed
- Yellow dot = running

**In Repository:**
- Badges can be added to README:
```markdown
![CI](https://github.com/yourteam/pufferphish/workflows/CI/badge.svg)
```

### Debugging Failed Workflows

1. Click on failed job
2. Expand failed step
3. Read error logs
4. Common issues:
   - Missing secrets
   - Build errors
   - Missing dependencies
   - AWS permission errors

## Customization

### Adding New Jobs

Edit `.github/workflows/ci.yml`:

```yaml
new-job:
  name: New Job Name
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run something
      run: npm run something
```

### Adding Environment Variables

For build-time variables:

```yaml
- name: Build
  run: npm run build
  env:
    NEW_VAR: ${{ secrets.NEW_SECRET }}
```

### Changing Deployment Behavior

Edit `.github/workflows/deploy.yml`:

```yaml
- name: Deploy something new
  run: |
    cd packages/new-package
    npm run deploy
```

## Best Practices

### Secrets Management
- **Never commit secrets** to repository
- Use GitHub Secrets for all sensitive data
- Rotate secrets regularly (every 90 days)
- Use different secrets for dev/prod

### Workflow Optimization
- Use `continue-on-error: true` for non-critical checks
- Use `--if-present` for optional npm scripts
- Check if directories exist before running commands
- Use caching for faster builds (`cache: 'npm'`)

### Deployment Safety
- Always deploy to development first
- Test thoroughly before production deployment
- Use manual approval for production (workflow_dispatch)
- Monitor CloudWatch logs after deployment

## Troubleshooting

### "npm ci failed"

**Cause:** package-lock.json out of sync

**Fix:**
```bash
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
```

### "CDK deploy failed"

**Possible causes:**
- AWS credentials invalid
- CDK not bootstrapped
- CloudFormation stack in bad state

**Fix:**
```bash
# Check credentials
aws sts get-caller-identity

# Bootstrap CDK
npx cdk bootstrap

# Check stack status
aws cloudformation describe-stacks
```

### "Vercel deployment failed"

**Possible causes:**
- Invalid Vercel token
- Project not linked
- Build errors

**Fix:**
1. Regenerate Vercel token
2. Run `vercel link` locally
3. Update GitHub secrets
4. Check build logs

### "Extension packaging failed"

**Cause:** Build didn't create dist/ folder

**Fix:**
```bash
cd packages/extension
npm run build
ls dist/  # Verify files exist
```

## Monitoring

### GitHub Actions Usage

Check Actions usage:
1. Settings → Billing → Plans and usage
2. View minutes used per month
3. Free tier: 2,000 minutes/month

### Cost Optimization

- Use `if: github.event.inputs.component == 'x'` to skip unnecessary jobs
- Use caching to reduce build time
- Cancel redundant workflow runs
- Use self-hosted runners for heavy builds (optional)

## Next Steps

After workflows are configured:

1. ✅ Add required secrets to GitHub
2. ✅ Test CI by pushing to billy-dev
3. ✅ Verify all jobs pass
4. ✅ Test deployment workflow manually
5. ✅ Fix any issues
6. ✅ Document any custom changes

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CDK Deployment](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Chrome Web Store Publishing](https://developer.chrome.com/docs/webstore/publish/)
