#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Get all API route files
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routeFiles = glob.sync('**/route.ts', { cwd: apiDir, absolute: true });

function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has dynamic export
    if (content.includes('export const dynamic')) {
      console.log(`✓ ${path.relative(__dirname, filePath)} already has dynamic export`);
      return;
    }
    
    // Check if this route uses any dynamic server features
    const usesServerFeatures = 
      content.includes('getServerSession') ||
      content.includes('headers()') ||
      content.includes('request.headers') ||
      content.includes('request.url') ||
      content.includes('nextUrl.searchParams') ||
      content.includes('cookies()') ||
      content.includes('searchParams.get') ||
      content.includes('headers:');
    
    if (!usesServerFeatures) {
      console.log(`⚪ ${path.relative(__dirname, filePath)} doesn't use server features`);
      return;
    }
    
    // Find the import statements
    const lines = content.split('\n');
    let insertIndex = 0;
    let lastImportOrCommentIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('/**') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/')) {
        lastImportOrCommentIndex = i;
      } else if (lastImportOrCommentIndex >= 0 && line === '') {
        insertIndex = i;
        break;
      } else if (lastImportOrCommentIndex >= 0 && !line.startsWith('import ') && line !== '' && !line.startsWith('//')) {
        insertIndex = lastImportOrCommentIndex + 1;
        break;
      }
    }
    
    // Insert dynamic export after imports/comments
    const dynamicExport = '\n// Force this route to be dynamic\nexport const dynamic = \'force-dynamic\'\n';
    
    if (insertIndex === 0 && lastImportOrCommentIndex >= 0) {
      insertIndex = lastImportOrCommentIndex + 1;
    }
    
    lines.splice(insertIndex, 0, dynamicExport);
    const newContent = lines.join('\n');
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added dynamic export to ${path.relative(__dirname, filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${path.relative(__dirname, filePath)}:`, error.message);
  }
}

console.log(`Found ${routeFiles.length} API route files\n`);

// Process all API route files
routeFiles.forEach(addDynamicExport);

console.log('\n🎉 Completed adding dynamic exports to all API routes that use server features!');