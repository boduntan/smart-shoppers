#!/bin/bash

# Setup script for Azure Artifacts authentication and staples-hk installation

echo "🔐 Setting up Azure Artifacts authentication for staples-hk package..."
echo ""

# Check if NPM_TOKEN is set
if [ -z "$NPM_TOKEN" ]; then
    echo "⚠️  NPM_TOKEN environment variable is not set!"
    echo ""
    echo "To authenticate with Azure Artifacts, you need to set NPM_TOKEN:"
    echo ""
    echo "1. Go to https://dev.azure.com/SPLS/Staples-ChatBot/_usersSettings/tokens"
    echo "2. Create a new Personal Access Token (PAT) with 'Packaging (Read)' scope"
    echo "3. Set the environment variable:"
    echo "   export NPM_TOKEN=<your-base64-encoded-PAT>"
    echo ""
    echo "To encode your PAT to base64:"
    echo "   echo -n '<your-pat-token>' | base64"
    echo ""
    echo "Or add it to your ~/.bashrc or ~/.zshrc:"
    echo "   export NPM_TOKEN='<your-base64-encoded-token>'"
    echo ""
    read -p "Do you have a PAT token? (y/n): " has_token
    
    if [ "$has_token" = "y" ]; then
        read -p "Enter your PAT token: " pat_token
        encoded_token=$(echo -n "$pat_token" | base64)
        export NPM_TOKEN="$encoded_token"
        echo "✅ Token set for this session"
    else
        echo "❌ Cannot proceed without authentication token"
        exit 1
    fi
fi

echo ""
echo "📦 Installing staples-hk package from Azure Artifacts..."
echo ""

# Clean install
rm -rf node_modules package-lock.json

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully installed staples-hk@0.0.3 from Azure Artifacts!"
    echo ""
    echo "Package location:"
    npm list staples-hk
    echo ""
    echo "🚀 You can now run: npm run dev"
else
    echo ""
    echo "❌ Installation failed. Please check:"
    echo "   1. NPM_TOKEN is correctly set"
    echo "   2. You have access to the Azure Artifacts feed"
    echo "   3. Network connection is stable"
fi
