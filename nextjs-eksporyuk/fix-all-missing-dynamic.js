const fs = require('fs');
const path = require('path');

function findAllApiRoutes(dir) {
  const routes = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        routes.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return routes;
}

function hasExportDynamic(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes("export const dynamic = 'force-dynamic'");
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

function addDynamicExport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has the export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      return false; // Already has it
    }
    
    // Add the export at the top after imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the best place to insert - after imports but before other exports
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('import{') || line.startsWith('import{')) {
        insertIndex = i + 1;
      } else if (line === '' && insertIndex > 0) {
        insertIndex = i + 1;
      } else if (line.startsWith('export ') && !line.includes('dynamic')) {
        break;
      }
    }
    
    // Insert the dynamic export
    lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic';");
    
    fs.writeFileSync(filePath, lines.join('\n'));
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const apiDir = path.join(__dirname, 'src', 'app', 'api');
console.log('🔍 Scanning for API routes...');

const allRoutes = findAllApiRoutes(apiDir);
console.log(`Found ${allRoutes.length} API route files`);

const routesWithoutDynamic = [];
const routesWithDynamic = [];

// Check each route
for (const routePath of allRoutes) {
  if (hasExportDynamic(routePath)) {
    routesWithDynamic.push(routePath);
  } else {
    routesWithoutDynamic.push(routePath);
  }
}

console.log(`\n📊 Status:`);
console.log(`✅ Routes with dynamic export: ${routesWithDynamic.length}`);
console.log(`❌ Routes missing dynamic export: ${routesWithoutDynamic.length}`);

if (routesWithoutDynamic.length > 0) {
  console.log(`\n🔧 Fixing ${routesWithoutDynamic.length} routes...`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const routePath of routesWithoutDynamic) {
    const relativePath = path.relative(__dirname, routePath);
    if (addDynamicExport(routePath)) {
      console.log(`✅ Fixed: ${relativePath}`);
      fixed++;
    } else {
      console.log(`❌ Failed: ${relativePath}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 Summary:`);
  console.log(`✅ Successfully fixed: ${fixed} routes`);
  console.log(`❌ Failed to fix: ${failed} routes`);
  console.log(`\n🚀 All API routes should now have the dynamic export!`);
} else {
  console.log(`\n🎉 All API routes already have the dynamic export!`);
}