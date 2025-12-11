#!/bin/bash
# Emergency VPS Server Check & Backup Script

echo "🔍 Checking VPS Server Status..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check server response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://app.eksporyuk.com)

echo ""
echo "Server Response Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 307 ]; then
    echo -e "${GREEN}✅ Server is ONLINE${NC}"
    SERVER_STATUS="online"
elif [ "$HTTP_CODE" -eq 502 ] || [ "$HTTP_CODE" -eq 503 ] || [ "$HTTP_CODE" -eq 521 ] || [ "$HTTP_CODE" -eq 522 ]; then
    echo -e "${RED}❌ Server is DOWN (Error $HTTP_CODE)${NC}"
    echo -e "${YELLOW}⚠️  Action needed: Restart VPS via IDCloudHost panel${NC}"
    SERVER_STATUS="down"
else
    echo -e "${YELLOW}⚠️  Server status UNKNOWN (HTTP $HTTP_CODE)${NC}"
    SERVER_STATUS="unknown"
fi

echo ""
echo "================================"
echo ""

# If server is online, offer to backup
if [ "$SERVER_STATUS" = "online" ]; then
    echo "📦 Ready to backup database?"
    echo ""
    echo "Run this command to backup:"
    echo ""
    echo "  ssh eksporyuk@157.10.253.103 'pg_dump -U eksporyuk_user eksporyuk' > backup-\$(date +%Y%m%d-%H%M).sql"
    echo ""
    echo "This will save database to: backup-YYYYMMDD-HHMM.sql"
    echo ""
else
    echo "⏳ Waiting for server to come back online..."
    echo ""
    echo "Next steps after server is online:"
    echo "  1. Run this script again"
    echo "  2. Backup database"
    echo "  3. Start Vercel migration"
    echo ""
fi

echo "================================"
echo ""
echo "Quick actions:"
echo "  • Check again:  ./check-server.sh"
echo "  • View logs:    ssh eksporyuk@157.10.253.103 'pm2 logs'"
echo "  • Server info:  ssh eksporyuk@157.10.253.103 'pm2 status'"
echo ""
