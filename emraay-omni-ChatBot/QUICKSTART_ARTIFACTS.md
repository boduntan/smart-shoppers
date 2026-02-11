# Quick Start - Install staples-hk from Azure Artifacts

## Step 1: Get Your Azure DevOps PAT Token

1. Visit: https://dev.azure.com/SPLS/Staples-ChatBot/_usersSettings/tokens
2. Click "New Token"
3. Set scope: **Packaging (Read)**
4. Copy the token

## Step 2: Encode Token

```bash
# Run this command (replace YOUR_TOKEN with your actual token)
echo -n 'YOUR_TOKEN' | base64
```

## Step 3: Set Environment Variable

```bash
export NPM_TOKEN='YOUR_BASE64_ENCODED_TOKEN'
```

## Step 4: Install Package

```bash
cd /c/work/chatBot/staples-omni-chatbot
npm install
```

## Done! 

The app will now use staples-hk@0.0.3 from Azure Artifacts.

---

## Alternative: Direct .npmrc with Token (Not Recommended for git)

If you want to test quickly without environment variables:

1. Create `.npmrc.local` (don't commit this!):
```
registry=https://registry.npmjs.org/
@staples:registry=https://pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/
always-auth=true
//pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/:username=SPLS
//pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/:_password=YOUR_BASE64_TOKEN
//pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/:email=npm@example.com
```

2. Rename it: `mv .npmrc.local .npmrc`
3. Run: `npm install`
4. **Important**: Add `.npmrc` to `.gitignore` if you hardcoded the token!
