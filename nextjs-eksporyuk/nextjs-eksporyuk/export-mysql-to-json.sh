#!/bin/bash

# Export MySQL data to JSON via SSH
# This is more stable than maintaining long SSH tunnel

echo "🔌 Connecting to server and exporting data..."

/usr/bin/expect << 'EOF'
set timeout 600
set password "Bismillah.2022"

spawn ssh aziz@103.125.181.47

expect {
    "password:" {
        send "$password\r"
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
}

expect "$ "

# Export users
send "mysql -u aziz_member.eksporyuk.com -p'E%ds(xRh3T]AA|Qh' aziz_member.eksporyuk.com -e \"SELECT u.ID as user_id, u.user_email, u.user_login, u.display_name, u.user_registered FROM wp_users u WHERE u.user_email != '' AND u.user_email IS NOT NULL ORDER BY u.ID\" --batch --skip-column-names > /tmp/users_export.tsv\r"

expect "$ "
send "wc -l /tmp/users_export.tsv\r"

expect "$ "

# Export orders  
send "mysql -u aziz_member.eksporyuk.com -p'E%ds(xRh3T]AA|Qh' aziz_member.eksporyuk.com -e \"SELECT o.ID as order_id, o.created_at as order_date, o.status, o.user_id, o.product_id, o.affiliate_id, o.grand_total, o.quantity, o.payment_gateway, o.type as order_type, u.user_email, u.display_name as user_name, p.post_title as product_name FROM wp_sejolisa_orders o LEFT JOIN wp_users u ON o.user_id = u.ID LEFT JOIN wp_posts p ON o.product_id = p.ID AND p.post_type = 'sejoli-product' WHERE o.deleted_at IS NULL ORDER BY o.ID\" --batch --skip-column-names > /tmp/orders_export.tsv\r"

expect "$ "
send "wc -l /tmp/orders_export.tsv\r"

expect "$ "

send "exit\r"
expect eof
EOF

echo ""
echo "📥 Downloading exported files..."

/usr/bin/expect << 'EOF'
set timeout 600
set password "Bismillah.2022"

spawn scp aziz@103.125.181.47:/tmp/users_export.tsv /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/

expect {
    "password:" {
        send "$password\r"
    }
}

expect eof

spawn scp aziz@103.125.181.47:/tmp/orders_export.tsv /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/

expect {
    "password:" {
        send "$password\r"
    }
}

expect eof
EOF

echo "✅ Export complete!"
echo "Files:"
ls -lh users_export.tsv orders_export.tsv 2>/dev/null || echo "Files not found"
