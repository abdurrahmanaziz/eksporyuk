const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Remove null values for JSON fields
function cleanRecord(record) {
  const cleaned = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== null) {
      cleaned[key] = value;
    }
    // Explicitly skip null values - Prisma will use defaults
  }
  return cleaned;
}

async function main() {
  const backupPath = path.join(__dirname, 'backup-restore-dec27.json');
  const backupData = JSON.parse(fs.readFileSync(backupPath));
  const tables = backupData.tables;
  
  // Fix Membership
  console.log('Fixing Membership...');
  if (tables.membership) {
    for (const m of tables.membership) {
      try {
        const data = cleanRecord(m);
        await prisma.membership.upsert({
          where: { id: m.id },
          create: data,
          update: data,
        });
        console.log('  ✓', m.name);
      } catch (e) {
        console.log('  ✗', m.name, '-', e.message.substring(0, 80));
      }
    }
  }
  
  // Fix Course - need to check mentorId
  console.log('\nFixing Course...');
  if (tables.course) {
    for (const c of tables.course) {
      try {
        // Check if mentor exists
        const mentor = await prisma.user.findUnique({ where: { id: c.mentorId } });
        if (!mentor) {
          console.log('  ✗', c.title, '- Mentor not found:', c.mentorId);
          continue;
        }
        
        const data = cleanRecord(c);
        await prisma.course.upsert({
          where: { id: c.id },
          create: data,
          update: data,
        });
        console.log('  ✓', c.title);
      } catch (e) {
        console.log('  ✗', c.title, '-', e.message.substring(0, 80));
      }
    }
  }
  
  // Fix Product
  console.log('\nFixing Product...');
  if (tables.product) {
    for (const p of tables.product) {
      try {
        const data = cleanRecord(p);
        await prisma.product.upsert({
          where: { id: p.id },
          create: data,
          update: data,
        });
        console.log('  ✓', p.name);
      } catch (e) {
        console.log('  ✗', p.name, '-', e.message.substring(0, 80));
      }
    }
  }
  
  // Fix Group
  console.log('\nFixing Group...');
  if (tables.group) {
    for (const g of tables.group) {
      try {
        const data = cleanRecord(g);
        await prisma.group.upsert({
          where: { id: g.id },
          create: data,
          update: data,
        });
        console.log('  ✓', g.name);
      } catch (e) {
        console.log('  ✗', g.name, '-', e.message.substring(0, 80));
      }
    }
  }
  
  // Verify
  console.log('\n✅ Verification:');
  console.log('  Memberships:', await prisma.membership.count());
  console.log('  Courses:', await prisma.course.count());
  console.log('  Products:', await prisma.product.count());
  console.log('  Groups:', await prisma.group.count());
  
  await prisma.$disconnect();
}

main().catch(console.error);
