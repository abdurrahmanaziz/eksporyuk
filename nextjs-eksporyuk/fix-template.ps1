Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   Fix Checkout Template System   " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop dev server
Write-Host "Step 1: Stopping dev server..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 2
Write-Host "✓ Dev server stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Sync database
Write-Host "Step 2: Syncing database schema..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database synced" -ForegroundColor Green
} else {
    Write-Host "✗ Database sync failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Generate Prisma client
Write-Host "Step 3: Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma client generation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Fix checkout templates
Write-Host "Step 4: Setting default templates..." -ForegroundColor Yellow
node fix-checkout-template.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Templates set" -ForegroundColor Green
} else {
    Write-Host "✗ Setting templates failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Done
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   ✓ Setup Complete!              " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now restart dev server with:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
