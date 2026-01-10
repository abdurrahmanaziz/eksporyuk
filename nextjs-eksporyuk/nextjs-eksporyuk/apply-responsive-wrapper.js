/**
 * Script untuk menambahkan ResponsivePageWrapper ke semua halaman dashboard
 * 
 * Usage: node apply-responsive-wrapper.js
 */

const fs = require('fs');
const path = require('path');

// Daftar halaman yang perlu di-update
const pagesToUpdate = [
  'src/app/(dashboard)/courses/page.tsx',
  'src/app/(dashboard)/my-courses/page.tsx',
  'src/app/(dashboard)/learn/page.tsx',
  'src/app/(dashboard)/chat/page.tsx',
  'src/app/(dashboard)/saved-posts/page.tsx',
  'src/app/(dashboard)/community/groups/page.tsx',
  'src/app/(dashboard)/community/feed/page.tsx',
  'src/app/(dashboard)/community/events/page.tsx',
  'src/app/(dashboard)/affiliate/page.tsx',
  'src/app/(dashboard)/affiliate/coupons/page.tsx',
  'src/app/(dashboard)/affiliate/wallet/page.tsx',
  'src/app/(dashboard)/admin/users/page.tsx',
  'src/app/(dashboard)/admin/courses/page.tsx',
  'src/app/(dashboard)/admin/groups/page.tsx',
  'src/app/(dashboard)/admin/features/page.tsx',
  'src/app/(dashboard)/admin/membership/page.tsx',
  'src/app/(dashboard)/admin/sales/page.tsx',
  'src/app/(dashboard)/admin/coupons/page.tsx',
  'src/app/(dashboard)/admin/certificates/page.tsx',
  'src/app/(dashboard)/admin/integrations/page.tsx',
];

function addResponsiveWrapper(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Skip if already has ResponsivePageWrapper
  if (content.includes('ResponsivePageWrapper')) {
    console.log(`✅ Already has wrapper: ${filePath}`);
    return true;
  }

  // Add import after 'use client'
  const importStatement = "import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'";
  
  // Find last import statement
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ') || importLines[i].trim().startsWith("import {")) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    importLines.splice(lastImportIndex + 1, 0, importStatement);
    content = importLines.join('\n');
  }

  // Wrap return statement
  // Find the first "return (" or "return("
  const returnMatch = content.match(/return\s*\(/);
  
  if (returnMatch) {
    const returnIndex = returnMatch.index;
    const beforeReturn = content.substring(0, returnIndex + returnMatch[0].length);
    const afterReturn = content.substring(returnIndex + returnMatch[0].length);
    
    // Find matching closing parenthesis
    let depth = 1;
    let endIndex = 0;
    
    for (let i = 0; i < afterReturn.length; i++) {
      if (afterReturn[i] === '(') depth++;
      if (afterReturn[i] === ')') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex > 0) {
      const insideReturn = afterReturn.substring(0, endIndex);
      const afterClosing = afterReturn.substring(endIndex);
      
      // Check if already wrapped with a div
      const trimmed = insideReturn.trim();
      
      if (trimmed.startsWith('<>') || trimmed.startsWith('<div') || trimmed.startsWith('<ResponsivePageWrapper')) {
        // Wrap the existing content
        content = beforeReturn + `\n    <ResponsivePageWrapper>\n${insideReturn}\n    </ResponsivePageWrapper>\n  ${afterClosing}`;
      } else {
        content = beforeReturn + `\n    <ResponsivePageWrapper>\n${insideReturn}\n    </ResponsivePageWrapper>\n  ${afterClosing}`;
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
  }
  
  console.log(`⚠️  Could not update: ${filePath}`);
  return false;
}

console.log('🚀 Applying ResponsivePageWrapper to all dashboard pages...\n');

let updated = 0;
let skipped = 0;
let failed = 0;

pagesToUpdate.forEach(page => {
  const result = addResponsiveWrapper(page);
  if (result === true) {
    updated++;
  } else if (result === false) {
    failed++;
  } else {
    skipped++;
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Updated: ${updated}`);
console.log(`⚠️  Failed: ${failed}`);
console.log(`✓  Skipped (already has wrapper): ${skipped}`);
console.log(`\n🎉 Done!`);
