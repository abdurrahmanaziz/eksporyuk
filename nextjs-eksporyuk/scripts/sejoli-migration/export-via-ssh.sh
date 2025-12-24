#!/bin/bash
# Export Sejoli Database via SSH
# This script exports data from remote MySQL via SSH

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📤 SEJOLI DATABASE EXPORT${NC}"
echo "=========================="
echo ""

# Configuration
SSH_USER="aziz"
SSH_HOST="103.125.181.47"
DB_USER="aziz_member.eksporyuk.com"
DB_NAME="aziz_member.eksporyuk.com"
DB_PASS='E%ds(xRh3T]AA|Qh'
EXPORT_DIR="./exports"

mkdir -p "$EXPORT_DIR"

echo "Configuration:"
echo "  SSH: $SSH_USER@$SSH_HOST"
echo "  Database: $DB_NAME"
echo ""
echo -e "${YELLOW}⚠️  You'll be prompted for SSH password: Bismillah.2022${NC}"
echo ""

# Function to export table
export_table() {
    local table=$1
    local filename=$2
    local query=$3
    
    echo "Exporting $filename..."
    
    ssh $SSH_USER@$SSH_HOST "mysql -u '$DB_USER' -p'$DB_PASS' '$DB_NAME' -e \"$query\" --batch --skip-column-names" > "$EXPORT_DIR/$filename.tsv" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        local lines=$(wc -l < "$EXPORT_DIR/$filename.tsv")
        echo -e "  ${GREEN}✅ Exported $lines rows${NC}"
    else
        echo -e "  ${RED}❌ Export failed${NC}"
    fi
    echo ""
}

# Export Users
export_table "wp_users" "users" "SELECT ID, user_login, user_email, user_registered, user_status, display_name FROM wp_users ORDER BY ID"

# Export User Meta
export_table "wp_usermeta" "user-meta" "SELECT user_id, meta_key, meta_value FROM wp_usermeta WHERE meta_key IN ('wp_capabilities', 'billing_phone', 'billing_address_1', 'billing_city', 'first_name', 'last_name') ORDER BY user_id"

# Check for Sejoli tables
echo "Checking Sejoli tables..."
ssh $SSH_USER@$SSH_HOST "mysql -u '$DB_USER' -p'$DB_PASS' '$DB_NAME' -e 'SHOW TABLES LIKE \"%sejoli%\"' --batch --skip-column-names" > "$EXPORT_DIR/_sejoli_tables.txt" 2>/dev/null

if [ -s "$EXPORT_DIR/_sejoli_tables.txt" ]; then
    echo -e "${GREEN}✅ Sejoli tables found:${NC}"
    cat "$EXPORT_DIR/_sejoli_tables.txt"
    echo ""
    
    # Try to export common Sejoli tables
    while IFS= read -r table; do
        export_table "$table" "${table/wp_/}" "SELECT * FROM $table LIMIT 1000"
    done < "$EXPORT_DIR/_sejoli_tables.txt"
else
    echo -e "${YELLOW}⚠️  No Sejoli tables found${NC}"
    echo ""
fi

# Export Products (posts)
export_table "wp_posts_products" "products" "SELECT ID, post_title, post_content, post_status, post_date, post_type FROM wp_posts WHERE post_type IN ('sejoli-product', 'product', 'membership') ORDER BY ID"

echo -e "${GREEN}✅ EXPORT COMPLETE!${NC}"
echo "===================="
echo ""
echo "📁 Exported files:"
ls -lh $EXPORT_DIR/*.tsv 2>/dev/null | awk '{print "  "$9" ("$5")"}'
echo ""
echo "Next step: Convert TSV to JSON and migrate"
echo ""
