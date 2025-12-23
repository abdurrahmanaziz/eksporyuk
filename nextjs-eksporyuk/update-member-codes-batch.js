/**
 * Batch Update Member Codes
 * Mengupdate memberCode untuk semua user yang belum punya
 * dalam batch kecil untuk menghindari timeout
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk generate member code
function generateMemberCode(sequence) {
  const prefix = 'EXP';
  const year = new Date().getFullYear().toString().slice(-2);
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `${prefix}${year}${paddedSequence}`;
}

async function getNextSequence() {
  // Get the highest current sequence
  const lastUser = await prisma.user.findFirst({
    where: {
      memberCode: {
        not: null,
        startsWith: 'EXP'
      }
    },
    orderBy: { memberCode: 'desc' },
    select: { memberCode: true }
  });

  if (!lastUser?.memberCode) {
    return 1;
  }

  // Extract number from memberCode like EXP24000123
  const match = lastUser.memberCode.match(/EXP\d{2}(\d+)/);
  if (match) {
    return parseInt(match[1], 10) + 1;
  }
  return 1;
}

async function updateBatch() {
  const BATCH_SIZE = 100; // Process 100 users at a time
  
  console.log('========================================');
  console.log('BATCH UPDATE MEMBER CODES');
  console.log('========================================\n');

  // Count users without memberCode
  const totalWithoutCode = await prisma.user.count({
    where: {
      OR: [
        { memberCode: null },
        { memberCode: '' }
      ]
    }
  });

  console.log(`Total users without memberCode: ${totalWithoutCode}`);
  
  if (totalWithoutCode === 0) {
    console.log('\n✅ Semua user sudah memiliki Member ID!');
    await prisma.$disconnect();
    return;
  }

  let sequence = await getNextSequence();
  console.log(`Starting sequence: ${sequence}`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);

  let processedTotal = 0;
  let batchNumber = 0;

  while (true) {
    batchNumber++;
    
    // Get batch of users without memberCode
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { memberCode: null },
          { memberCode: '' }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (users.length === 0) {
      break;
    }

    console.log(`\n📦 Batch #${batchNumber}: Processing ${users.length} users...`);

    // Update each user in this batch
    for (const user of users) {
      const newCode = generateMemberCode(sequence);
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { memberCode: newCode }
        });
        
        sequence++;
        processedTotal++;
        
        // Progress indicator every 10 users
        if (processedTotal % 10 === 0) {
          process.stdout.write(`  ✓ ${processedTotal}/${totalWithoutCode} (${Math.round(processedTotal/totalWithoutCode*100)}%)\r`);
        }
      } catch (err) {
        console.error(`\n  ❌ Failed for ${user.email}: ${err.message}`);
      }
    }

    console.log(`  ✓ Batch #${batchNumber} complete: ${processedTotal}/${totalWithoutCode}`);
    
    // Small delay between batches to prevent overload
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n========================================');
  console.log(`✅ COMPLETE! Updated ${processedTotal} users`);
  console.log('========================================');

  // Verify
  const remaining = await prisma.user.count({
    where: {
      OR: [
        { memberCode: null },
        { memberCode: '' }
      ]
    }
  });
  console.log(`\nVerification: ${remaining} users still without memberCode`);

  await prisma.$disconnect();
}

updateBatch().catch(err => {
  console.error('Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
