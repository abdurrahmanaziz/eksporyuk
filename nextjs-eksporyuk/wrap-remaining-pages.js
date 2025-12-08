const fs = require('fs');
const path = require('path');

// Pages already completed
const completed = [
  'my-courses/page.tsx',
  'saved-posts/page.tsx',
  'notifications/page.tsx',
  'admin/page.tsx',
  'courses/page.tsx',
  'community/groups/[slug]/page.tsx',
  'community/groups/page.tsx',
  'wallet/page.tsx',
  'dashboard/page.tsx',
  'dashboard/my-products/page.tsx',
  'dashboard/wallet/page.tsx',
  'my-dashboard/page.tsx',
  'certificates/page.tsx',
  'chat/page.tsx',
  'learn/page.tsx',
  'affiliate/wallet/page.tsx',
  'admin/dashboard/page.tsx',
  'admin/users/page.tsx',
  'admin/courses/page.tsx',
  'admin/features/page.tsx',
  'admin/membership/page.tsx'
];

// Find all page.tsx files in dashboard
const dashboardDir = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/src/app/(dashboard)';

function getAllPageFiles(dir, base = '') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllPageFiles(fullPath, path.join(base, item)));
    } else if (item === 'page.tsx') {
      files.push({ relativePath: path.join(base, item), fullPath });
    }
  }
  
  return files;
}

function wrapPageWithResponsiveWrapper(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if already has ResponsivePageWrapper
  if (content.includes('ResponsivePageWrapper')) {
    console.log(`✓ Skip ${filePath} - already wrapped`);
    return false;
  }
  
  // Find first import line
  const importMatch = content.match(/^import .+ from .+$/m);
  if (!importMatch) {
    console.log(`✗ Skip ${filePath} - no imports found`);
    return false;
  }
  
  const importIndex = content.indexOf(importMatch[0]);
  const nextLineIndex = content.indexOf('\n', importIndex);
  
  // Add ResponsivePageWrapper import after first import
  const importLine = "\nimport ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'";
  content = content.slice(0, nextLineIndex) + importLine + content.slice(nextLineIndex);
  
  // Find main return statement (usually after "return (" at component level)
  // Look for "export default function" or "export default async function"
  const funcMatch = content.match(/export default (async )?function \w+\([^)]*\) \{/);
  if (!funcMatch) {
    console.log(`✗ Skip ${filePath} - no default function found`);
    return false;
  }
  
  const funcStart = content.indexOf(funcMatch[0]) + funcMatch[0].length;
  
  // Find first "return (" after function start
  const returnMatch = content.slice(funcStart).match(/\n  return \(\n    <(div|Responsive)/);
  if (!returnMatch) {
    console.log(`✗ Skip ${filePath} - no return statement found`);
    return false;
  }
  
  const returnIndex = funcStart + content.slice(funcStart).indexOf(returnMatch[0]);
  
  // Check if already wrapped with ResponsivePageWrapper
  if (returnMatch[0].includes('ResponsivePageWrapper')) {
    console.log(`✓ Skip ${filePath} - already wrapped in return`);
    return false;
  }
  
  // Find the closing of the return statement
  // Strategy: find the last ") }" before the end of file or next function
  const afterReturn = content.slice(returnIndex);
  const closingMatch = afterReturn.match(/\n  \)\n\}/);
  
  if (!closingMatch) {
    console.log(`✗ Skip ${filePath} - no closing found`);
    return false;
  }
  
  const closingIndex = returnIndex + afterReturn.indexOf(closingMatch[0]);
  
  // Insert opening ResponsivePageWrapper
  const returnLineEnd = returnIndex + returnMatch[0].length - 6; // Before "<div"
  content = content.slice(0, returnLineEnd) + '\n    <ResponsivePageWrapper>' + content.slice(returnLineEnd);
  
  // Insert closing ResponsivePageWrapper (adjust for the insertion above)
  const adjustedClosingIndex = closingIndex + '\n    <ResponsivePageWrapper>'.length;
  const closingLineStart = adjustedClosingIndex + 3; // After "  )"
  content = content.slice(0, closingLineStart) + '\n    </ResponsivePageWrapper>' + content.slice(closingLineStart);
  
  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Wrapped ${filePath}`);
  return true;
}

// Get all page files
const allPages = getAllPageFiles(dashboardDir);
console.log(`Found ${allPages.length} total pages`);

let wrapped = 0;
let skipped = 0;

for (const page of allPages) {
  try {
    const result = wrapPageWithResponsiveWrapper(page.fullPath);
    if (result) wrapped++;
    else skipped++;
  } catch (err) {
    console.error(`✗ Error processing ${page.fullPath}: ${err.message}`);
    skipped++;
  }
}

console.log(`\nSummary:`);
console.log(`  Wrapped: ${wrapped}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Total: ${allPages.length}`);
