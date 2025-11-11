# GitHub Secrets Configuration

## Required Secrets

These secrets must be configured in your GitHub repository for CI/CD to work:

### AWS Credentials
- **AWS_ACCESS_KEY_ID**: Your AWS access key
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret key  
- **AWS_ACCOUNT_ID**: Your AWS account ID (12 digits)

### Deployment Secrets (Set after CDK deployment)
- **S3_BUCKET_NAME**: S3 bucket for dashboard hosting
- **CLOUDFRONT_DISTRIBUTION_ID**: CloudFront distribution ID

### Optional Secrets
- **SNYK_TOKEN**: For security vulnerability scanning

## Setup Methods

### Method 1: Using the Setup Script (Recommended)
```bash
# Run the automated setup script
./scripts/setup-github-secrets.sh
```

### Method 2: GitHub CLI Manual Setup
```bash
# Set each secret individually
gh secret set AWS_ACCESS_KEY_ID --body "your-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret-key"
gh secret set AWS_ACCOUNT_ID --body "your-account-id"

# List all secrets to verify
gh secret list
```

### Method 3: GitHub Web Interface
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

## Security Best Practices

1. **Never commit secrets to the repository**
   - Use `.env` for local development only
   - Ensure `.env` is in `.gitignore`

2. **Use least privilege AWS credentials**
   - Create an IAM user specifically for CI/CD
   - Grant only necessary permissions

3. **Rotate credentials regularly**
   - Update AWS access keys every 90 days
   - Update secrets in GitHub after rotation

4. **Use environment-specific secrets**
   - Separate credentials for dev/staging/production
   - Use GitHub environments for deployment protection

## Troubleshooting

### Secret not found error in workflow
- Verify secret name matches exactly (case-sensitive)
- Check secret is set: `gh secret list`
- Ensure workflow has access to secrets

### Authentication failures
- Verify AWS credentials are active
- Check IAM permissions for the user
- Ensure region is correct (us-east-1)

### Workflow permission errors
- Check repository settings → Actions → General
- Ensure "Read and write permissions" is enabled

## Local Development vs CI/CD

| Configuration | Local Development | GitHub Actions |
|--------------|------------------|----------------|
| AWS Credentials | `.env` file | GitHub Secrets |
| Database | Local PostgreSQL | GitHub Service |
| Environment | development | development/production |
| Source | `.env` file | `${{ secrets.NAME }}` |

## Next Steps

1. Run `./scripts/setup-github-secrets.sh` to configure secrets
2. Create GitHub repository if not exists
3. Push code to trigger workflows
4. Monitor Actions tab for build status