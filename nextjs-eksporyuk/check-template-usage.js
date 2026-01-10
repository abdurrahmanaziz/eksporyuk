import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    // Get usage breakdown
    const templates = await prisma.brandedTemplate.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        name: true,
        type: true,
        usageCount: true,
        category: true
      },
      orderBy: { usageCount: 'desc' }
    });

    console.log('=== TEMPLATE USAGE BREAKDOWN ===\n');
    
    // Summary
    const totalActive = templates.length;
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const used = templates.filter(t => t.usageCount > 0).length;
    const unused = templates.filter(t => t.usageCount === 0).length;

    console.log(`Total Active Templates: ${totalActive}`);
    console.log(`Total Usage Count: ${totalUsage}`);
    console.log(`Used Templates: ${used} (with usageCount > 0)`);
    console.log(`Unused Templates: ${unused} (usageCount = 0)\n`);

    // Group by type
    const byType = {};
    templates.forEach(t => {
      if (!byType[t.type]) byType[t.type] = { total: 0, usage: 0, list: [] };
      byType[t.type].total++;
      byType[t.type].usage += t.usageCount;
      byType[t.type].list.push(t);
    });

    console.log('=== BY TYPE ===\n');
    Object.entries(byType).forEach(([type, data]) => {
      console.log(`${type}: ${data.total} templates, ${data.usage} total usage`);
      data.list.forEach(t => {
        console.log(`  • ${t.slug}: ${t.usageCount} uses`);
      });
      console.log('');
    });

    // Top templates
    console.log('=== TOP 20 MOST USED ===\n');
    templates.slice(0, 20).forEach((t, i) => {
      console.log(`${i+1}. ${t.slug} (${t.type}): ${t.usageCount} uses`);
    });

    // Unused templates
    console.log('\n=== UNUSED TEMPLATES (0 USAGE) ===\n');
    const unusedTemplates = templates.filter(t => t.usageCount === 0);
    console.log(`Total Unused: ${unusedTemplates.length}\n`);
    unusedTemplates.forEach(t => {
      console.log(`• ${t.slug} (${t.type}) - ${t.category || 'no category'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
