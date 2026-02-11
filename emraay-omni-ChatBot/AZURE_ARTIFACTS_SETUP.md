# Azure Artifacts Setup for Staples-HK Component

This document explains how to configure and use the `staples-hk` component from Azure Artifacts in the omni-chatbot application.

## Package Information

- **Package Name**: `staples-hk`
- **Version**: `0.0.3`
- **Registry**: Azure Artifacts
- **Feed URL**: `https://pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/`
- **Package URL**: [View in Azure DevOps](https://dev.azure.com/SPLS/Staples-ChatBot/_artifacts/feed/staples-hk/Npm/staples-hk/overview/0.0.3)

## Local Setup

### Prerequisites

1. Access to the Azure DevOps project: `SPLS/Staples-ChatBot`
2. Personal Access Token (PAT) with `Packaging (Read)` scope

### Step 1: Create Personal Access Token

1. Go to [Azure DevOps User Settings → Tokens](https://dev.azure.com/SPLS/Staples-ChatBot/_usersSettings/tokens)
2. Click **"+ New Token"**
3. Configure:
   - **Name**: `npm-staples-hk-read`
   - **Organization**: `SPLS`
   - **Scopes**: Select **Packaging (Read)**
   - **Expiration**: Choose appropriate duration
4. Click **Create**
5. **Copy the token** (you won't be able to see it again!)

### Step 2: Encode Token to Base64

```bash
# On Linux/Mac/Git Bash
echo -n 'YOUR_PAT_TOKEN_HERE' | base64

# On Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('YOUR_PAT_TOKEN_HERE'))
```

### Step 3: Set Environment Variable

**For Current Session:**
```bash
export NPM_TOKEN='YOUR_BASE64_ENCODED_TOKEN'
```

**Permanent Setup (Recommended):**

Add to `~/.bashrc` or `~/.zshrc`:
```bash
export NPM_TOKEN='YOUR_BASE64_ENCODED_TOKEN'
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Step 4: Install Package

**Option A: Using Setup Script (Recommended)**
```bash
cd /c/work/chatBot/staples-omni-chatbot
bash setup-artifacts.sh
```

**Option B: Manual Installation**
```bash
cd /c/work/chatBot/staples-omni-chatbot
rm -rf node_modules package-lock.json
npm install
```

### Step 5: Verify Installation

```bash
npm list staples-hk
# Should show: staples-hk@0.0.3
```

## CI/CD Setup (Azure Pipelines)

The `.npmrc` is already configured. Azure Pipelines will automatically authenticate using the pipeline's service connection.

The `azure-pipelines.yml` should include:

```yaml
- task: Npm@1
  displayName: 'Authenticate to Azure Artifacts'
  inputs:
    command: 'custom'
    customCommand: 'config set //pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/:_authToken $(System.AccessToken)'

- task: Npm@1
  displayName: 'Install Dependencies'
  inputs:
    command: 'install'
```

## Usage in Code

The package is already imported and used in the application:

```typescript
// In main.tsx and components
import { defineCustomElements } from 'staples-hk/loader';

// Initialize web components
defineCustomElements(window);
```

## Troubleshooting

### Error: "Unable to authenticate"

1. Verify NPM_TOKEN is set: `echo $NPM_TOKEN`
2. Check token hasn't expired in Azure DevOps
3. Ensure token has correct scopes (Packaging Read)
4. Verify base64 encoding is correct

### Error: "404 Not Found"

1. Check package version exists in feed (currently using 0.0.3)
2. Verify feed URL is correct
3. Ensure you have access to the Azure DevOps project

### Error: "EACCES: permission denied"

```bash
# Clean and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Network/Proxy Issues

If behind corporate proxy:
```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

## Package Updates

To update to a newer version:

1. Check available versions in [Azure Artifacts](https://dev.azure.com/SPLS/Staples-ChatBot/_artifacts/feed/staples-hk/Npm/staples-hk/)
2. Update `package.json`:
   ```json
   "staples-hk": "0.0.4"  // or latest version
   ```
3. Run `npm install`

## Files Modified

- `.npmrc` - Azure Artifacts registry configuration
- `package.json` - Updated dependency from local file to Azure Artifacts
- `setup-artifacts.sh` - Helper script for local setup

## Security Notes

⚠️ **Never commit PAT tokens to git!**
- `.npmrc` is configured to use environment variable
- Add `.npmrc` with hardcoded tokens to `.gitignore` if needed
- Rotate tokens regularly
- Use minimum required scopes
