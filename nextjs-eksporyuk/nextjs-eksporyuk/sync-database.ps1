# Script to sync database with Prisma schema
Write-Host "Stopping dev server..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "`nSyncing database schema..." -ForegroundColor Green
npx prisma db push --accept-data-loss

Write-Host "`nRegenerating Prisma client..." -ForegroundColor Green
npx prisma generate

Write-Host "`nSetting default templates..." -ForegroundColor Green
node set-default-templates.js

Write-Host "`nDatabase sync complete!" -ForegroundColor Green
Write-Host "You can now restart dev server with: npm run dev" -ForegroundColor Cyan
