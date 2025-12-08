import { prisma } from './prisma'

/**
 * Generate unique invoice number with format: INV001, INV002, etc.
 * Auto-increments based on count of transactions
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get total count of transactions
    const transactionCount = await prisma.transaction.count()
    const nextNumber = transactionCount + 1

    // Format: INV01, INV02, ..., INV99, INV100, etc.
    const paddedNumber = nextNumber.toString().padStart(2, '0')
    return `INV${paddedNumber}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    // Fallback: use timestamp-based ID
    return `INV${Date.now().toString().slice(-6)}`
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
