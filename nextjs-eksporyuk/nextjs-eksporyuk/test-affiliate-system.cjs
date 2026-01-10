#!/usr/bin/env node

/**
 * Test script for affiliate role assignment and leaderboard system
 * Tests:
 * 1. Role assignment endpoint validation
 * 2. Leaderboard API role-based access control
 * 3. Data integrity checks
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

let passedTests = 0;
let failedTests = 0;

// Test 1: Verify assign-role endpoint exists
log.section('TEST 1: Verify assign-role endpoint file exists');
const assignRoleFile = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/admin/affiliates/[id]/assign-role/route.ts');
if (fs.existsSync(assignRoleFile)) {
  log.success('assign-role endpoint file exists');
  
  // Check file content
  const content = fs.readFileSync(assignRoleFile, 'utf8');
  
  // Verify key functions exist
  const checks = [
    { name: 'POST handler', pattern: /export async function POST/ },
    { name: 'Session validation', pattern: /getServerSession/ },
    { name: 'Admin role check', pattern: /role !== 'ADMIN'/ },
    { name: 'User validation', pattern: /prisma\.user\.findUnique/ },
    { name: 'Affiliate profile check', pattern: /affiliateProfile\.applicationStatus !== 'APPROVED'/ },
    { name: 'Role assignment with upsert', pattern: /prisma\.userRole\.upsert/ },
    { name: 'Duplicate check', pattern: /existingRole/ },
    { name: 'Error handling', pattern: /catch \(error\)/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log.success(`Has ${check.name}`);
      passedTests++;
    } else {
      log.error(`Missing ${check.name}`);
      failedTests++;
    }
  });
} else {
  log.error('assign-role endpoint file not found');
  failedTests++;
}

// Test 2: Verify leaderboard API has role-based access
log.section('TEST 2: Verify leaderboard API has role-based access');
const leaderboardFile = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/admin/affiliates/leaderboard/modern/route.ts');
if (fs.existsSync(leaderboardFile)) {
  log.success('leaderboard endpoint file exists');
  
  const content = fs.readFileSync(leaderboardFile, 'utf8');
  
  const checks = [
    { name: 'Session validation', pattern: /getServerSession/ },
    { name: 'Allow ADMIN role', pattern: /isAdmin\s*=\s*session\.user\.role === 'ADMIN'/ },
    { name: 'Allow AFFILIATE role', pattern: /isAffiliate\s*=\s*session\.user\.role === 'AFFILIATE'/ },
    { name: 'Role-based access check', pattern: /if \(!isAdmin && !isAffiliate\)/ },
    { name: 'Affiliate data filtering', pattern: /if \(isAffiliate && currentUserId\)/ },
    { name: 'AFFILIATE users see only themselves', pattern: /slice\(0, isAffiliate \? 1 : 10\)/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log.success(`Has ${check.name}`);
      passedTests++;
    } else {
      log.error(`Missing ${check.name}`);
      failedTests++;
    }
  });
} else {
  log.error('leaderboard endpoint file not found');
  failedTests++;
}

// Test 3: Verify affiliate leaderboard page exists
log.section('TEST 3: Verify affiliate leaderboard page exists');
const affiliateLeaderboardFile = path.join(__dirname, 'nextjs-eksporyuk/src/app/(dashboard)/affiliate/leaderboard/page.tsx');
if (fs.existsSync(affiliateLeaderboardFile)) {
  log.success('affiliate leaderboard page file exists');
  
  const content = fs.readFileSync(affiliateLeaderboardFile, 'utf8');
  
  const checks = [
    { name: 'useSession hook', pattern: /useSession/ },
    { name: 'Role validation', pattern: /session\?\.user\?\.role !== 'AFFILIATE'/ },
    { name: 'Redirect unauthenticated', pattern: /unauthenticated.*login/ },
    { name: 'Redirect wrong role', pattern: /dashboard/ },
    { name: 'Leaderboard component', pattern: /ModernLeaderboard/ },
    { name: 'Auto-refresh', pattern: /setInterval.*30000/ },
    { name: 'Performance stats cards', pattern: /All-Time Performance|This Week|This Month/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log.success(`Has ${check.name}`);
      passedTests++;
    } else {
      log.error(`Missing ${check.name}`);
      failedTests++;
    }
  });
} else {
  log.error('affiliate leaderboard page file not found');
  failedTests++;
}

// Test 4: Verify admin affiliates page has role UI
log.section('TEST 4: Verify admin affiliates page has role assignment UI');
const adminAffiliatesFile = path.join(__dirname, 'nextjs-eksporyuk/src/app/(dashboard)/admin/affiliates/page.tsx');
if (fs.existsSync(adminAffiliatesFile)) {
  log.success('admin affiliates page file exists');
  
  const content = fs.readFileSync(adminAffiliatesFile, 'utf8');
  
  const checks = [
    { name: 'Role in Affiliate interface', pattern: /user:\s*\{[\s\S]*?role\?/ },
    { name: 'showRoleAssignModal state', pattern: /showRoleAssignModal/ },
    { name: 'roleAssignLoading state', pattern: /roleAssignLoading/ },
    { name: 'handleAssignAffiliateRole function', pattern: /handleAssignAffiliateRole/ },
    { name: 'Role column in table', pattern: /text-center.*Role/ },
    { name: 'Role assignment button', pattern: /setShowRoleAssignModal\(true\)/ },
    { name: 'Role assignment modal', pattern: /showRoleAssignModal.*Dialog/ },
    { name: 'AFFILIATE role badge', pattern: /role === 'AFFILIATE'/ },
    { name: 'Assign role badge', pattern: /Assign Role/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log.success(`Has ${check.name}`);
      passedTests++;
    } else {
      log.error(`Missing ${check.name}`);
      failedTests++;
    }
  });
} else {
  log.error('admin affiliates page file not found');
  failedTests++;
}

// Test 5: Schema validation
log.section('TEST 5: Verify schema has necessary models');
const schemaFile = path.join(__dirname, 'nextjs-eksporyuk/prisma/schema.prisma');
if (fs.existsSync(schemaFile)) {
  log.success('schema file exists');
  
  const content = fs.readFileSync(schemaFile, 'utf8');
  
  const checks = [
    { name: 'UserRole model exists', pattern: /model UserRole/ },
    { name: 'UserRole has userId and role', pattern: /userId\s+String[\s\S]*?role\s+Role/ },
    { name: 'UserRole unique constraint', pattern: /@@unique\(\[userId, role\]\)/ },
    { name: 'Role enum defined', pattern: /enum Role/ },
    { name: 'AFFILIATE role in enum', pattern: /enum Role[\s\S]*?AFFILIATE/ },
    { name: 'User model has userRoles relation', pattern: /userRoles\s+UserRole\[\]/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log.success(`Has ${check.name}`);
      passedTests++;
    } else {
      log.error(`Missing ${check.name}`);
      failedTests++;
    }
  });
} else {
  log.error('schema file not found');
  failedTests++;
}

// Summary
log.section('TEST SUMMARY');
const total = passedTests + failedTests;
console.log(`\nTotal Tests: ${total}`);
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

if (failedTests === 0) {
  console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
  process.exit(1);
}
