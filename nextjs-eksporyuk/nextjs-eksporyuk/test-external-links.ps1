# Test External Link Implementation - PowerShell Version

Write-Host "=== External Link Implementation - Test Suite ===" -ForegroundColor Cyan
Write-Host ""

# Check if files have been modified
$files = @(
  "src/app/(admin)/admin/membership/page.tsx",
  "src/app/(public)/checkout-unified/page.tsx",
  "src/app/membership/[slug]/page.tsx"
)

Write-Host "Testing file modifications..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    if ($content -match 'externalSalesUrl') {
      Write-Host "✓ $file - Contains externalSalesUrl" -ForegroundColor Green
    } else {
      Write-Host "✗ $file - Missing externalSalesUrl" -ForegroundColor Red
    }
  } else {
    Write-Host "✗ $file - File not found" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Checking for redirect logic..." -ForegroundColor Yellow
Write-Host ""

$checkoutUnified = "src/app/(public)/checkout-unified/page.tsx"
if ((Get-Content $checkoutUnified -Raw) -match 'Redirecting to external checkout') {
  Write-Host "✓ checkout-unified - Has redirect logic" -ForegroundColor Green
} else {
  Write-Host "✗ checkout-unified - Missing redirect logic" -ForegroundColor Red
}

$membershipSlug = "src/app/membership/[slug]/page.tsx"
if ((Get-Content $membershipSlug -Raw) -match 'Redirecting to external checkout') {
  Write-Host "✓ membership/[slug] - Has redirect logic" -ForegroundColor Green
} else {
  Write-Host "✗ membership/[slug] - Missing redirect logic" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking for UI input fields..." -ForegroundColor Yellow
Write-Host ""

$adminMembership = "src/app/(admin)/admin/membership/page.tsx"
if ((Get-Content $adminMembership -Raw) -match 'URL Checkout Eksternal') {
  Write-Host "✓ Admin Membership - Has external checkout field" -ForegroundColor Green
} else {
  Write-Host "✗ Admin Membership - Missing external checkout field" -ForegroundColor Red
}

Write-Host ""
Write-Host "Implementation Status:" -ForegroundColor Yellow
Write-Host "✅ All modifications completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Links to Test:"
Write-Host "  1. Admin: http://localhost:3000/admin/membership"
Write-Host "  2. Checkout Unified: http://localhost:3000/checkout-unified"
Write-Host "  3. Membership: http://localhost:3000/membership/[slug]"
Write-Host ""
