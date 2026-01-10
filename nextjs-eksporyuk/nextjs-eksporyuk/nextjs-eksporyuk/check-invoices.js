const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoices() {
    const lastInvoices = await prisma.transaction.findMany({
        where: {
            invoiceNumber: {
                not: null
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
            invoiceNumber: true,
            createdAt: true,
            amount: true,
            customerName: true
        }
    });
    
    console.log('📋 LAST 30 INVOICE NUMBERS:\n');
    lastInvoices.forEach((tx, i) => {
        console.log(`${i+1}. ${tx.invoiceNumber} - ${tx.customerName} - Rp. ${tx.amount.toLocaleString()} - ${tx.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Find the highest invoice number
    const invNumbers = [];
    lastInvoices.forEach(tx => {
        if (tx.invoiceNumber.startsWith('INV')) {
            const afterINV = tx.invoiceNumber.substring(3);
            if (/^\d+$/.test(afterINV)) {
                invNumbers.push(parseInt(afterINV));
            }
        }
    });
    
    if (invNumbers.length > 0) {
        const maxInv = Math.max(...invNumbers);
        console.log(`\n🔢 Highest invoice number: INV${maxInv}`);
        console.log(`📌 Next invoice should be: INV${maxInv + 1}`);
    }
    
    await prisma.$disconnect();
}

checkInvoices();
