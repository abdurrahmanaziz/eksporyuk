import { prisma } from './prisma'

/**
 * Generate unique invoice number continuing from Sejoli format
 * Format: INV followed by incrementing number (no padding)
 * Example: INV19300, INV19301, INV19302...
 * 
 * This continues from the highest Sejoli invoice number in the database.
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // OPTIMIZED: Get only the latest invoice with DESC ordering (much faster)
    const latestTransaction = await prisma.transaction.findFirst({
      where: { 
        invoiceNumber: { startsWith: 'INV' }
      },
      select: { invoiceNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 100 // Get last 100 to scan for highest number
    })
    
    // If no invoices yet, start from a safe number
    if (!latestTransaction) {
      return `INV${Date.now().toString().slice(-5)}` // 5 digits from timestamp
    }
    
    // Get the last 100 transactions to find max number
    const recentTransactions = await prisma.transaction.findMany({
      where: { 
        invoiceNumber: { startsWith: 'INV' }
      },
      select: { invoiceNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    let maxNumber = 0
    for (const tx of recentTransactions) {
      const match = tx.invoiceNumber?.match(/^INV(\d+)$/)
      if (match) {
        const num = parseInt(match[1])
        if (num > maxNumber) maxNumber = num
      }
    }
    
    // Next invoice number = max + 1
    const nextNumber = maxNumber + 1
    
    // Format: INV followed by number (no leading zeros to match Sejoli format)
    return `INV${nextNumber}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    // Fallback: use timestamp-based ID with random suffix to avoid collisions
    return `INV${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`
  }
}

/**
 * Check if invoice number already exists
 */
export async function invoiceExists(invoiceNumber: string): Promise<boolean> {
  const transaction = await prisma.transaction.findUnique({
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
