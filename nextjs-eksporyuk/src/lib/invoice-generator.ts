import { prisma } from './prisma'

/**
 * Generate unique invoice number with sequential format
 * Format: INV-XXXX (with dash and leading zeros)
 * Example: INV-0001, INV-0002, INV-0003...
 * 
 * Uses database to track highest number to ensure proper sequencing
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get the last 1000 transactions to find max number across both formats
    const recentTransactions = await prisma.transaction.findMany({
      where: { 
        invoiceNumber: { not: null }
      },
      select: { invoiceNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 1000
    })

    let maxNumber = 0;

    // Parse both old format (INV19300) and new format (INV-0001)
    for (const tx of recentTransactions) {
      if (!tx.invoiceNumber) continue;
      
      // Try new format first: INV-XXXX
      let match = tx.invoiceNumber.match(/^INV-(\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
        continue;
      }
      
      // Try old Sejoli format: INVXXXXX
      match = tx.invoiceNumber.match(/^INV(\d+)$/);
      if (match && match[1]) {
        const numStr = match[1];
        // If it's a large number from Sejoli (5+ digits), use it as base
        if (numStr.length >= 5) {
          const num = parseInt(numStr, 10);
          if (num > maxNumber) maxNumber = num;
        }
      }
    }

    // Next invoice number
    // If we have no previous numbers, start from 1
    // If we had old format (high numbers), continue from there
    // Otherwise continue sequential
    const nextNumber = maxNumber > 0 ? maxNumber + 1 : 1;

    // Format with leading zeros (4 digits minimum for new format)
    if (maxNumber > 9999) {
      // If we inherited high Sejoli numbers, don't pad (continue in 5+ digit format)
      return `INV-${nextNumber}`;
    } else {
      // New system: use 4-digit format with leading zeros
      return `INV-${String(nextNumber).padStart(4, '0')}`;
    }
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback: use timestamp-based ID
    return `INV-${Date.now().toString().slice(-6)}`;
  }
}

/**
 * Check if an invoice number already exists
 */
export async function invoiceExists(invoiceNumber: string): Promise<boolean> {
  const transaction = await prisma.transaction.findFirst({
    where: { invoiceNumber: invoiceNumber }
  })
  return !!transaction
}

/**
 * Get next available invoice number (with retry logic)
 */
export async function getNextInvoiceNumber(maxRetries: number = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const invoiceNumber = await generateInvoiceNumber()
    const exists = await invoiceExists(invoiceNumber)
    
    if (!exists) {
      return invoiceNumber
    }
    
    // If exists, wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
  }
  
  // Ultimate fallback if all retries fail
  return `INV${Date.now().toString().slice(-8)}`
}
