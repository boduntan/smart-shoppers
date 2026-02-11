#!/bin/bash

echo "🔍 Azure VM Access Checker"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

VM_IP="20.220.23.102"
VNET_IP="207.219.79.126"

echo "VM Public IP: $VM_IP"
echo "VNET IP: $VNET_IP"
echo ""

# Test from current location
echo "1️⃣ Testing from your current location..."
CURRENT_IP=$(curl -s http://ifconfig.me)
echo "   Your current public IP: $CURRENT_IP"
echo ""

# Test API accessibility
echo "2️⃣ Testing API access..."
if curl -s --connect-timeout 5 http://$VM_IP:3000/api/health | grep -q "success"; then
    echo -e "   ${GREEN}✅ API is accessible from your current location${NC}"
else
    echo -e "   ${RED}❌ API is NOT accessible from your current location${NC}"
fi
echo ""

# Test what you should whitelist
echo "3️⃣ IPs you should whitelist in Azure NSG:"
echo ""
echo "   Recommended Source IP ranges for port 3000 rule:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   $VNET_IP/32          (Your VNET)"
echo "   $CURRENT_IP/32       (Your current location)"
echo ""
echo "   Combined (comma-separated for Azure):"
echo "   $VNET_IP/32,$CURRENT_IP/32"
echo ""

echo "4️⃣ How to update Azure NSG:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Portal Method:"
echo "   1. Go to: portal.azure.com"
echo "   2. Find your VM → Networking → Network settings"
echo "   3. Edit the rule for port 3000"
echo "   4. Change Source: Any → IP Addresses"
echo "   5. Add: $VNET_IP/32,$CURRENT_IP/32"
echo "   6. Save"
echo ""
echo "   Azure CLI Method:"
echo "   az network nsg rule update \\"
echo "     --resource-group YOUR-RG \\"
echo "     --nsg-name YOUR-NSG \\"
echo "     --name AllowBackendAPI \\"
echo "     --source-address-prefixes $VNET_IP/32 $CURRENT_IP/32"
echo ""

echo "5️⃣ Security Best Practices:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ Whitelist only trusted IPs"
echo "   ✅ Use /32 for single IPs (most restrictive)"
echo "   ✅ Use /24 for network ranges (e.g., 207.219.79.0/24)"
echo "   ✅ Set up nginx on port 80 instead of exposing 3000"
echo "   ✅ Enable HTTPS with SSL certificate"
echo "   ⚠️  Avoid using 'Any' or '0.0.0.0/0' in production"
echo ""

echo "6️⃣ Test from VNET (207.219.79.126):"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   After whitelisting, test from that network:"
echo "   curl http://$VM_IP:3000/api/health"
echo ""
