Write-Host "Starting Next.js server..." -ForegroundColor Cyan
Set-Location "C:\Users\GIGABTYE AORUS'\Herd\eksporyuk\nextjs-eksporyuk"

# Clear cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start server
Write-Host "`nServer will run on: http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

npx next dev -p 3000
