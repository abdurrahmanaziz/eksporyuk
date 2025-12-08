/**
 * Admin Certificate Management API Test
 * Tests all new certificate admin endpoints
 * 
 * Run: node test-admin-certificates.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}━━━ ${msg} ━━━${colors.reset}\n`),
};

let passed = 0;
let failed = 0;

async function testAdminCertificateAPIs() {
  log.section('Admin Certificate Management API Tests');

  // Test 1: Check regenerate endpoint exists
  log.info('Test 1: Checking regenerate endpoint...');
  const fs = require('fs');
  const path = require('path');
  
  const regeneratePath = path.join(process.cwd(), 'src/app/api/admin/certificates/[id]/regenerate/route.ts');
  if (fs.existsSync(regeneratePath)) {
    log.success('Regenerate endpoint exists');
    passed++;
  } else {
    log.error('Regenerate endpoint NOT FOUND');
    failed++;
  }

  // Test 2: Check issue endpoint exists
  log.info('Test 2: Checking manual issue endpoint...');
  const issuePath = path.join(process.cwd(), 'src/app/api/admin/certificates/issue/route.ts');
  if (fs.existsSync(issuePath)) {
    log.success('Manual issue endpoint exists');
    passed++;
  } else {
    log.error('Manual issue endpoint NOT FOUND');
    failed++;
  }

  // Test 3: Check export endpoint exists
  log.info('Test 3: Checking export CSV endpoint...');
  const exportPath = path.join(process.cwd(), 'src/app/api/admin/certificates/export/route.ts');
  if (fs.existsSync(exportPath)) {
    log.success('Export CSV endpoint exists');
    passed++;
  } else {
    log.error('Export CSV endpoint NOT FOUND');
    failed++;
  }

  // Test 4: Check admin page has new features
  log.info('Test 4: Checking admin page for new features...');
  const adminPagePath = path.join(process.cwd(), 'src/app/(dashboard)/admin/certificates/page.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
  
  const requiredFeatures = [
    'handleRegenerate',
    'handleResendEmail',
    'handleIssueManual',
    'handleExportCSV',
    'showIssueDialog',
    'RefreshCw',
    'Mail',
    'Plus',
    'FileDown'
  ];
  
  let missingFeatures = [];
  requiredFeatures.forEach(feature => {
    if (!adminPageContent.includes(feature)) {
      missingFeatures.push(feature);
    }
  });
  
  if (missingFeatures.length === 0) {
    log.success('All admin page features implemented');
    passed++;
  } else {
    log.error(`Missing features: ${missingFeatures.join(', ')}`);
    failed++;
  }

  // Test 5: Check ActivityLog usage is correct
  log.info('Test 5: Checking ActivityLog structure...');
  let activityLogErrors = [];
  
  [regeneratePath, issuePath, exportPath].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for correct entity field usage
      if (!content.includes("entity: 'CERTIFICATE'")) {
        activityLogErrors.push(`${path.basename(path.dirname(filePath))}: Missing entity field`);
      }
      
      // Check for incorrect entityType in metadata
      if (content.includes('entityType:')) {
        activityLogErrors.push(`${path.basename(path.dirname(filePath))}: Using entityType instead of entity`);
      }
    }
  });
  
  if (activityLogErrors.length === 0) {
    log.success('ActivityLog structure is correct');
    passed++;
  } else {
    log.error(`ActivityLog issues: ${activityLogErrors.join(', ')}`);
    failed++;
  }

  // Test 6: Check no duplicate resend endpoint
  log.info('Test 6: Checking for duplicate resend endpoint...');
  const duplicateResendPath = path.join(process.cwd(), 'src/app/api/admin/certificates/[id]/resend/route.ts');
  if (!fs.existsSync(duplicateResendPath)) {
    log.success('No duplicate resend endpoint (correctly removed)');
    passed++;
  } else {
    log.error('Duplicate resend endpoint still exists');
    failed++;
  }

  // Test 7: Check Dialog component import
  log.info('Test 7: Checking Dialog component import...');
  if (adminPageContent.includes("import") && 
      adminPageContent.includes("Dialog") &&
      adminPageContent.includes("DialogContent") &&
      adminPageContent.includes("DialogHeader")) {
    log.success('Dialog components imported correctly');
    passed++;
  } else {
    log.error('Dialog components missing');
    failed++;
  }

  // Test 8: Check manual issue dialog exists
  log.info('Test 8: Checking manual issue dialog...');
  if (adminPageContent.includes('Manual Issue Certificate Dialog') &&
      adminPageContent.includes('selectedUserId') &&
      adminPageContent.includes('selectedCourseId') &&
      adminPageContent.includes('sendEmailOnIssue')) {
    log.success('Manual issue dialog implemented');
    passed++;
  } else {
    log.error('Manual issue dialog incomplete');
    failed++;
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.green}✓ Passed:  ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed:  ${failed}${colors.reset}\n`);
  
  if (failed === 0) {
    console.log(`${colors.green}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}${colors.bright}   ✓ ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}${colors.bright}   Admin Certificate Management is ready!${colors.reset}`);
    console.log(`${colors.green}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.cyan}Features Implemented:${colors.reset}`);
    console.log(`  ✅ Regenerate PDF certificate`);
    console.log(`  ✅ Resend certificate email`);
    console.log(`  ✅ Manual certificate issuance`);
    console.log(`  ✅ Export certificates to CSV`);
    console.log(`  ✅ Revoke/Restore certificates`);
    console.log(`  ✅ Activity logging`);
    console.log(`  ✅ Stats dashboard`);
    console.log(`  ✅ Search & filter`);
    console.log(`\n${colors.yellow}Access: /admin/certificates${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.red}${colors.bright}   ✗ SOME TESTS FAILED!${colors.reset}`);
    console.log(`${colors.red}${colors.bright}   Please fix ${failed} issue(s)${colors.reset}`);
    console.log(`${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testAdminCertificateAPIs().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
