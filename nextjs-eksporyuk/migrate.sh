#!/bin/bash
# Quick Migration Commands - Copy & Paste

echo "🚀 EKSPORYUK MIGRATION COMMANDS"
echo "================================"
echo ""

PS3='Pilih action: '
options=(
    "1. Check server status"
    "2. Backup database"
    "3. Upload fixed files to VPS"
    "4. Rebuild & restart VPS"
    "5. Setup Vercel CLI"
    "6. Deploy to Vercel staging"
    "7. View full checklist"
    "8. Exit"
)

select opt in "${options[@]}"
do
    case $opt in
        "1. Check server status")
            echo ""
            echo "📡 Checking server..."
            ./check-server.sh
            break
            ;;
        "2. Backup database")
            echo ""
            echo "📦 Backing up database..."
            ssh eksporyuk@157.10.253.103 'pg_dump -U eksporyuk_user eksporyuk' > backup-$(date +%Y%m%d-%H%M).sql
            echo "✅ Backup saved: backup-$(date +%Y%m%d-%H%M).sql"
            ls -lh backup-*.sql | tail -1
            break
            ;;
        "3. Upload fixed files to VPS")
            echo ""
            echo "📤 Uploading fixed files..."
            cd nextjs-eksporyuk
            
            echo "Uploading forgot-password route..."
            scp src/app/api/auth/forgot-password/route.ts eksporyuk@157.10.253.103:~/eksporyuk/nextjs-eksporyuk/src/app/api/auth/forgot-password/route.ts
            
            echo "Uploading xendit balance route..."
            scp src/app/api/admin/xendit/balance/route.ts eksporyuk@157.10.253.103:~/eksporyuk/nextjs-eksporyuk/src/app/api/admin/xendit/balance/route.ts
            
            echo "Uploading prisma config..."
            scp src/lib/prisma.ts eksporyuk@157.10.253.103:~/eksporyuk/nextjs-eksporyuk/src/lib/prisma.ts
            
            echo "✅ All files uploaded!"
            break
            ;;
        "4. Rebuild & restart VPS")
            echo ""
            echo "🔨 Rebuilding on VPS..."
            ssh eksporyuk@157.10.253.103 'cd ~/eksporyuk/nextjs-eksporyuk && NODE_OPTIONS="--max-old-space-size=4096" npm run build && pm2 restart eksporyuk && pm2 status'
            break
            ;;
        "5. Setup Vercel CLI")
            echo ""
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
            echo ""
            echo "🔐 Login to Vercel..."
            vercel login
            echo ""
            echo "🔗 Linking project..."
            cd nextjs-eksporyuk
            vercel
            break
            ;;
        "6. Deploy to Vercel staging")
            echo ""
            echo "🚀 Creating staging branch..."
            git checkout -b staging 2>/dev/null || git checkout staging
            git push origin staging
            echo ""
            echo "✅ GitHub Actions will auto-deploy!"
            echo "Check: https://github.com/abdurrahmanaziz/eksporyuk/actions"
            break
            ;;
        "7. View full checklist")
            echo ""
            cat MIGRATION_CHECKLIST.md
            break
            ;;
        "8. Exit")
            break
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

echo ""
echo "================================"
echo "Next: Read MIGRATION_CHECKLIST.md for full guide"
