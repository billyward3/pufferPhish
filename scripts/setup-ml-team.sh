#!/bin/bash

# ML Team Setup Script
# Sets up development environment for ML component

set -e

echo "🤖 Setting up ML Team Development Environment"
echo "=============================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required. Install from python.org" >&2; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo "❌ pip3 is required. Install with Python 3" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from nodejs.org" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "⚠️  AWS CLI not found. You'll need this for deployment: brew install awscli" >&2; }

echo "✅ Prerequisites check passed"
echo ""

# Navigate to ML package
cd packages/ml-engine

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "Python version: $PYTHON_VERSION"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "⚠️  No requirements.txt found"
fi

# Install Node dependencies (for CDK deployment)
cd ../../infrastructure
if [ -f "package.json" ]; then
    echo "Installing infrastructure dependencies..."
    npm install
    echo "✅ Infrastructure dependencies installed"
fi

cd ..

echo ""
echo "✅ ML Team setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Read docs/01-ml-integration.md for integration specs"
echo "2. Read docs/security/01-ml-security.md for security requirements"
echo "3. Activate venv: source packages/ml-engine/venv/bin/activate"
echo "4. Start development in packages/ml-engine/"
echo ""
echo "📝 Integration contract:"
echo "   - Input: { url, domain, metadata }"
echo "   - Output: { riskScore, threats, confidence, source, modelVersion }"
echo "   - Target: <500ms inference time"
echo ""
