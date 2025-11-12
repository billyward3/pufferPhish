#!/bin/bash

# Extension Team Setup Script
# Sets up development environment for Chrome extension

set -e

echo "🧩 Setting up Extension Team Development Environment"
echo "====================================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from nodejs.org" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required. Install with Node.js" >&2; exit 1; }

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version 18+ recommended (you have $(node --version))"
fi

echo "✅ Prerequisites check passed"
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Navigate to extension package
cd packages/extension

# Install extension dependencies
echo "Installing extension dependencies..."
npm install

# --- NEW STEP ---
echo "Installing Webpack plugin to copy manifest.json..."
# This plugin will allow Webpack to copy the manifest to the dist/ folder
npm install --save-dev copy-webpack-plugin
npm install --save-dev html-webpack-plugin
npm install --save-dev typescript ts-loader
npm install --save-dev style-loader css-loader
# --- END NEW STEP ---


# Build extension
echo "Building extension..."

npm run build

# Check if build succeeded
if [ -d "dist" ]; then
    # Check for manifest (it might not be there yet)
    if [ ! -f "dist/manifest.json" ]; then
        echo "⚠️  Build succeeded, but manifest.json is still missing in dist/."
        echo "   You must complete the next step (editing webpack.config.js) and re-run this script."
    else
        echo "✅ Extension built successfully"
    fi
    
    echo ""
    echo "📦 Extension ready to load in Chrome:"
    echo "   1. Open Chrome and go to chrome://extensions"
    echo "   2. Enable 'Developer mode' (toggle in top-right)"
    echo "   3. Click 'Load unpacked'"
    echo "   4. Select: $(pwd)/dist"
else
    echo "❌ Build failed - dist/ folder not created"
    exit 1
fi

cd ../..

echo ""
echo "✅ Extension Team setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Read docs/02-extension-integration.md for integration specs"
echo "2. Read docs/security/02-extension-security.md for security requirements"
echo "3. Load extension in Chrome (see instructions above)"
echo "4. Start development: npm run dev --workspace=@pufferphish/extension"
echo ""
echo "🔌 API Integration:"
echo "   - Backend API will be deployed by backend team"
echo "   - Update src/config.ts with API URL when available"
echo "   - Authentication: JWT tokens via Bearer header"
echo ""
echo "⚙️  Development commands:"
echo "   npm run dev      # Watch mode (auto-rebuild on changes)"
echo "   npm run build    # Production build"
echo "   npm run lint     # Check code quality"
echo ""