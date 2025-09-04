#!/bin/bash

# PufferPhish Setup Script

set -e

echo "Setting up PufferPhish development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install

# Install dependencies for each package
echo "Installing package dependencies..."
for dir in packages/*/; do
    if [ -f "$dir/package.json" ]; then
        echo "Installing dependencies in $dir"
        (cd "$dir" && npm install)
    fi
done

# Install infrastructure dependencies
echo "Installing infrastructure dependencies..."
(cd infrastructure && npm install)

# Setup environment file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update .env with your AWS credentials"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker daemon is not running. Please start Docker Desktop and try again."
    echo "On macOS: Open Docker Desktop from Applications"
    exit 1
fi

# Start database
echo "Starting PostgreSQL..."
docker-compose up -d

# Wait for database
echo "Waiting for database to be ready..."
sleep 5

# Setup database schema
echo "Setting up database schema..."
cd packages/database
npx prisma generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pufferphish_dev" npx prisma db push
cd ../..

# Install global tools
echo "Installing global tools..."
npm install -g aws-cdk turborepo

echo "Setup complete!"
echo "Next steps:"
echo "1. Update .env with your AWS credentials"
echo "2. Run 'npm run dev' to start development"
echo "3. Check docs/ folder for documentation"