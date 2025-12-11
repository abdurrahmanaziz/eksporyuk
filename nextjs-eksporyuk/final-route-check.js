const fs = require('fs');
const path = require('path');

function findAllApiRoutes(dir, routes = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      findAllApiRoutes(itemPath, routes);
    } else if (stat.isFile() && /\.(ts|js)$/.test(item) && item !== 'middleware.ts') {
      routes.push(itemPath);
    }
  }
  
  return routes;
}

const apiDir = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/src/app/api';
const routes = findAllApiRoutes(apiDir);

console.log(`\nFound ${routes.length} API route files\n`);

let routesWithIssues = [];
let routesWithCorrectExport = 0;

for (const routePath of routes) {
  try {
    const content = fs.readFileSync(routePath, 'utf-8');
    
    // Check for dynamic export
    const hasDynamicExport = content.includes('export const dynamic = \'force-dynamic\'') || 
                            content.includes('export const dynamic = "force-dynamic"');
    
    // Check for dynamic server usage
    const usesDynamicFeatures = [
      'getServerSession',
      'headers()',
      'cookies()', 
      'request.url',
      'nextUrl.searchParams',
      'NextRequest',
      'await headers',
      'await cookies',
      '.headers.get',
      '.cookies.get'
    ].some(feature => content.includes(feature));
    
    if (usesDynamicFeatures && !hasDynamicExport) {
      routesWithIssues.push({
        file: routePath.replace('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/', ''),
        reason: 'Uses dynamic features but missing dynamic export'
      });
    } else if (hasDynamicExport) {
      routesWithCorrectExport++;
    }
    
    // Check for syntax errors in export
    if (content.includes('export const dynamic') && !hasDynamicExport) {
      routesWithIssues.push({
        file: routePath.replace('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/', ''),
        reason: 'Has malformed dynamic export'
      });
    }
    
  } catch (error) {
    routesWithIssues.push({
      file: routePath.replace('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/', ''),
      reason: `Read error: ${error.message}`
    });
  }
}

console.log(`✅ Routes with correct dynamic export: ${routesWithCorrectExport}`);
console.log(`❌ Routes with issues: ${routesWithIssues.length}`);

if (routesWithIssues.length > 0) {
  console.log('\nIssues found:');
  routesWithIssues.forEach(issue => {
    console.log(`- ${issue.file}: ${issue.reason}`);
  });
} else {
  console.log('\n🎉 All API routes are properly configured!');
  console.log('\nThe build should work on Vercel now. Try redeploying.');
}