// Simple script to update transaction status
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.transaction.updateMany({
    where: {
      invoiceNumber: 'INV1767079675827',
      status: 'PENDING'
    },
    data: {
      status: 'PENDING_CONFIRMATION'
    }
  });
  
  console.log('Updated transactions:', result.count);
  await prisma.$disconnect();
}

main().catch(console.error);