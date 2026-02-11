# Configure Azure Artifacts Feed with npmjs.org Upstream

## Problem
The Azure Artifacts feed `staples-hk` needs to have npmjs.org configured as an upstream source so that all npm packages (like @testing-library/jest-dom, react, etc.) can be resolved while also serving the custom staples-hk package.

## Solution: Configure Upstream in Azure DevOps

### Steps:

1. **Go to Feed Settings:**
   - Navigate to: https://dev.azure.com/SPLS/Staples-ChatBot/_artifacts/feed/staples-hk
   - Click on the gear icon (⚙️) or "Feed Settings"

2. **Add Upstream Source:**
   - Go to "Upstream sources" tab
   - Click "+ Add upstream"
   - Select "Public source"
   - Choose "npmjs (https://registry.npmjs.org/)"
   - Click "Add"

3. **Configure Upstream Behavior:**
   - Set "Include upstream packages in search" to **Enabled**
   - Set "Save packages from upstream" to **Enabled** (optional, for caching)

4. **Save Settings**

### After Configuration:

Once the upstream is configured, the .npmrc in the omni-chatbot app is already set up correctly:

```npmrc
registry=https://pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/
```

This will:
- Serve `staples-hk@0.0.3` from Azure Artifacts
- Proxy all other packages from npmjs.org automatically

### Verify Configuration:

```bash
cd /c/work/chatBot/staples-omni-chatbot
rm -rf node_modules package-lock.json
npm install
```

You should see:
- ✅ staples-hk@0.0.3 installed from Azure Artifacts
- ✅ All other packages installed from npmjs.org (via upstream)

---

## Alternative: If You Can't Configure Upstream

If you cannot configure the upstream, you can use a hybrid approach in .npmrc (not recommended for production):

```npmrc
# This is NOT recommended - configure upstream instead
registry=https://registry.npmjs.org/

# Override registry only for staples package
@staples:registry=https://pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/

# Auth
//pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/:username=SPLS
//pkgs.dev.azure.com/SPLS/Staples-ChatBot/_packaging/staples-hk/npm/registry/:_password=TOKEN
```

But this requires the package to be scoped (@staples/staples-hk) which it currently isn't.

---

## Current Status

✅ package.json updated to use `staples-hk: "0.0.3"` from artifacts  
✅ .npmrc configured with Azure Artifacts authentication  
⚠️ **ACTION NEEDED:** Configure npmjs.org upstream in Azure Artifacts feed settings
