# Stop all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Regenerate Prisma client
Write-Host "Regenerating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "Done! Starting dev server..." -ForegroundColor Green
npm run dev
