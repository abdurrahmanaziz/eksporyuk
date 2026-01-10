#!/bin/bash

# FIX MYSQL REMOTE ACCESS
# ========================
# Enable remote MySQL access di HestiaCP

echo "🔧 MySQL Remote Access Setup"
echo "============================="
echo ""
echo "📋 Steps to enable in HestiaCP:"
echo ""
echo "1. Login ke HestiaCP: https://103.125.181.47:8083"
echo "2. Klik menu 'DB' (Database)"
echo "3. Find database: aziz_member.eksporyuk.com"
echo "4. Klik 'Edit' (icon pensil)"
echo "5. Di field 'Remote Access', tambahkan:"
echo "   - IP laptop kamu, ATAU"
echo "   - % (allow all - temporary untuk testing)"
echo "6. Klik 'Save'"
echo ""
echo "🔍 Cara cek IP laptop kamu:"
echo "   curl ifconfig.me"
echo ""

MY_IP=$(curl -s ifconfig.me)

if [ -n "$MY_IP" ]; then
    echo "✅ IP laptop kamu: $MY_IP"
    echo ""
    echo "📝 Add ini di HestiaCP Remote Access: $MY_IP"
else
    echo "⚠️  Tidak bisa detect IP, cek manual:"
    echo "   https://whatismyipaddress.com/"
fi

echo ""
echo "🔄 Alternative: SSH Tunnel (jika remote access tidak bisa)"
echo "   Masalah SSH mungkin karena:"
echo "   - Password salah"
echo "   - SSH key tidak setup"
echo "   - Port 22 blocked"
echo ""
echo "   Coba fix:"
echo "   ssh -v -L 3306:localhost:3306 eksporyuk@103.125.181.47"
echo "   (option -v untuk verbose debug)"
echo ""
echo "📱 Atau bisa minta tolong host provider allow remote MySQL"
