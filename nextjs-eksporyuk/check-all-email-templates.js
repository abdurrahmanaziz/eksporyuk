import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js';
import dotenv from 'dotenv';

// Load environment variables from the nextjs project
dotenv.config({ path: './nextjs-eksporyuk/.env' });

const prisma = new PrismaClient();

async function auditAllTemplates() {
  try {
    console.log('🔍 AUDITING ALL EMAIL TEMPLATES IN SYSTEM\n');
    
    // Get all templates
    const templates = await prisma.brandedTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        type: true,
        isActive: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`📊 TOTAL TEMPLATES: ${templates.length}\n`);
    
    // Group by category
    const byCategory = {};
    templates.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = [];
      }
      byCategory[t.category].push(t);
    });
    
    // Display by category
    Object.keys(byCategory).sort().forEach(category => {
      console.log(`📁 ${category} (${byCategory[category].length} templates):`);
      byCategory[category].forEach(t => {
        const status = t.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
        const usage = t.usageCount || 0;
        const lastUsed = t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : 'Never';
        console.log(`   ${status} ${t.name}`);
        console.log(`      Slug: ${t.slug}`);
        console.log(`      Usage: ${usage} times, Last: ${lastUsed}`);
      });
      console.log('');
    });
    
    // Summary statistics
    console.log('📈 SUMMARY BY CATEGORY:');
    let totalActive = 0;
    Object.keys(byCategory).sort().forEach(category => {
      const active = byCategory[category].filter(t => t.isActive).length;
      const total = byCategory[category].length;
      totalActive += active;
      console.log(`   ${category}: ${active}/${total} active`);
    });
    
    console.log(`\n🎯 OVERALL STATUS:`);
    console.log(`   Total Templates: ${templates.length}`);
    console.log(`   Active Templates: ${totalActive}`);
    console.log(`   Inactive Templates: ${templates.length - totalActive}`);
    console.log(`   Target: 150+ templates`);
    console.log(`   Gap: ${150 - templates.length} templates needed\n`);
    
    // Check template types
    const byType = {};
    templates.forEach(t => {
      if (!byType[t.type]) byType[t.type] = 0;
      byType[t.type]++;
    });
    
    console.log('📋 TEMPLATE TYPES:');
    Object.keys(byType).sort().forEach(type => {
      console.log(`   ${type}: ${byType[type]} templates`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('SQLITE_CANTOPEN')) {
      console.log('\n💡 Try: Make sure you are in the correct directory and database file exists');
    }
  } finally {
    await prisma.$disconnect();
  }
}

auditAllTemplates().catch(console.error);