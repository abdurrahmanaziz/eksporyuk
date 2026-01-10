# Stop all node processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Clean .next folder
Write-Host "Cleaning .next folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Get-ChildItem ".next" -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item ".next" -Force -Recurse -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Start dev server
Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev
