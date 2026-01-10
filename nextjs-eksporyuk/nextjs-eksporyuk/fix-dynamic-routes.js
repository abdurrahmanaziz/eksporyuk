#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// List of routes that need dynamic export based on build errors
const problematicRoutes = [
  'api/cron/product-reminders/route.ts',
  'api/documentation/route.ts',
  'api/enrollments/my-courses/route.ts',
  'api/events/stats/route.ts',
  'api/events/upcoming/route.ts',
  'api/groups/suggested/route.ts',
  'api/member/profile-status/route.ts',
  'api/member/check-email-verified/route.ts',
  'api/member/access/route.ts',
  'api/member/route.ts',
  'api/databases/buyers/export/route.ts',
  'api/databases/buyers/template/route.ts',
  'api/memberships/route.ts',
  'api/memberships/user/route.ts',
  'api/members/directory/route.ts',
  'api/membership-documents/route.ts',
  'api/mentor/classes/route.ts',
  'api/mentor/assignments/route.ts',
  'api/mentor/materials/courses/route.ts',
  'api/mentor/materials/route.ts',
  'api/mentor/products/route.ts',
  'api/supplier/membership/current/route.ts',
  'api/user/products/route.ts',
  'api/user/transactions/stats/route.ts',
  'api/user/membership/transactions/route.ts',
  'api/users/notification-preferences/route.ts',
  'api/users/search/route.ts'
];

const srcDir = path.join(__dirname, 'src', 'app');

function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has dynamic export
    if (content.includes('export const dynamic')) {
      console.log(`✓ ${filePath} already has dynamic export`);
      return;
    }
    
    // Find the import statements
    const lines = content.split('\n');
    let insertIndex = 0;
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        lastImportIndex = i;
      } else if (lastImportIndex >= 0 && line === '') {
        insertIndex = i;
        break;
      } else if (lastImportIndex >= 0 && !line.startsWith('import ') && line !== '') {
        insertIndex = lastImportIndex + 1;
        break;
      }
    }
    
    // Insert dynamic export after imports
    const dynamicExport = '\n// Force this route to be dynamic\nexport const dynamic = \'force-dynamic\'\n';
    
    if (insertIndex === 0 && lastImportIndex >= 0) {
      insertIndex = lastImportIndex + 1;
    }
    
    lines.splice(insertIndex, 0, dynamicExport);
    const newContent = lines.join('\n');
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Added dynamic export to ${filePath}`);
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Process all problematic routes
problematicRoutes.forEach(routePath => {
  const fullPath = path.join(srcDir, routePath);
  if (fs.existsSync(fullPath)) {
    addDynamicExport(fullPath);
  } else {
    console.log(`⚠ File not found: ${fullPath}`);
  }
});

console.log('\nDone! Run npm run build to test if issues are resolved.');