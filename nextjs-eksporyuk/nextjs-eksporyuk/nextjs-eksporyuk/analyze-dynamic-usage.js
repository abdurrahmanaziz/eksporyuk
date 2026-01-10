const fs = require('fs');
const path = require('path');

// Patterns that indicate dynamic server usage
const dynamicPatterns = [
  'headers()',
  'cookies()',
  'request.url',
  'request.headers',
  'nextUrl.searchParams',
  'getServerSession',
  'searchParams.get',
  'url.searchParams'
];

function findRoutesWithDynamicUsage(dir) {
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

function analyzeRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasDynamicExport = content.includes("export const dynamic = 'force-dynamic'");
    
    const foundPatterns = [];
    for (const pattern of dynamicPatterns) {
      if (content.includes(pattern)) {
        foundPatterns.push(pattern);
      }
    }
    
    return {
      hasDynamicExport,
      foundPatterns,
      needsFix: foundPatterns.length > 0 && !hasDynamicExport
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return { hasDynamicExport: false, foundPatterns: [], needsFix: false };
  }
}

// Main execution
const apiDir = path.join(__dirname, 'src', 'app', 'api');
console.log('🔍 Analyzing API routes for dynamic server usage...');

const allRoutes = findRoutesWithDynamicUsage(apiDir);
console.log(`Found ${allRoutes.length} API route files`);

const routesNeedingFix = [];
const routesWithDynamicUsage = [];
const routesAlreadyFixed = [];

for (const routePath of allRoutes) {
  const analysis = analyzeRoute(routePath);
  
  if (analysis.foundPatterns.length > 0) {
    routesWithDynamicUsage.push({
      path: routePath,
      patterns: analysis.foundPatterns,
      hasDynamicExport: analysis.hasDynamicExport
    });
    
    if (analysis.needsFix) {
      routesNeedingFix.push(routePath);
    } else if (analysis.hasDynamicExport) {
      routesAlreadyFixed.push(routePath);
    }
  }
}

console.log(`\n📊 Analysis Results:`);
console.log(`🔧 Routes using dynamic features: ${routesWithDynamicUsage.length}`);
console.log(`✅ Already have dynamic export: ${routesAlreadyFixed.length}`);
console.log(`❌ Need dynamic export: ${routesNeedingFix.length}`);

if (routesNeedingFix.length > 0) {
  console.log(`\n❌ Routes that STILL need the dynamic export:`);
  routesNeedingFix.forEach(route => {
    const relativePath = path.relative(__dirname, route);
    const analysis = routesWithDynamicUsage.find(r => r.path === route);
    console.log(`   ${relativePath} - uses: ${analysis.patterns.join(', ')}`);
  });
} else {
  console.log(`\n🎉 All routes with dynamic usage have the proper export!`);
}

// Show some examples of routes with dynamic usage
if (routesWithDynamicUsage.length > 0) {
  console.log(`\n📝 Sample routes with dynamic patterns:`);
  routesWithDynamicUsage.slice(0, 5).forEach(route => {
    const relativePath = path.relative(__dirname, route.path);
    const status = route.hasDynamicExport ? '✅' : '❌';
    console.log(`   ${status} ${relativePath} - uses: ${route.patterns.join(', ')}`);
  });
}