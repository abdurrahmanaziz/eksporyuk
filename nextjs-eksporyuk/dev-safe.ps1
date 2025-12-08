$ErrorActionPreference = "SilentlyContinue"
Set-Location "C:\Users\GIGABTYE AORUS'\Herd\eksporyuk\nextjs-eksporyuk"

# Kill existing node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove .next folder
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Set environment
$env:NEXT_TELEMETRY_DISABLED = "1"

# Start server
Write-Host "Starting Next.js dev server on port 3005..." -ForegroundColor Green
npx next dev -p 3005
