import { prisma } from './prisma'

/**
 * Extract numeric part from any invoice format
 * Handles: INV-0001, INV19300, 1M617767967563, etc.
 */
function extractInvoiceNumber(invoiceStr: string): number {
  if (!invoiceStr) return 0;
  
  // Try INV-XXXX format first
  let match = invoiceStr.match(/INV-(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  // Try INVXXXXX format
  match = invoiceStr.match(/INV(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  // Try pulling just the numbers
  const numbers = invoiceStr.replace(/\D/g, '');
  if (numbers) {
    return parseInt(numbers, 10);
  }
  
  return 0;
}

/**
 * Generate unique invoice number with sequential format
 * Format: INV-XXXXX (with dash, continue from highest existing number)
 * Example: INV-00001, INV-00002, INV-12906, INV-12907...
 * 
 * Uses database to track highest number to ensure proper sequencing
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get ALL transactions with invoiceNumber to find absolute max
    const allTransactions = await prisma.transaction.findMany({
      where: { 
        invoiceNumber: { not: null }
      },
      select: { invoiceNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 5000  // Get more to be safe
    })

    let maxNumber = 0;

    // Parse all invoice formats to find highest numeric value
    for (const tx of allTransactions) {
      if (!tx.invoiceNumber) continue;
      
      const num = extractInvoiceNumber(tx.invoiceNumber);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }

    // Next invoice number is always max + 1
    const nextNumber = maxNumber + 1;

    // Format: INV-XXXXX (5 digits minimum to accommodate high numbers)
    if (nextNumber <= 9999) {
      return `INV-${String(nextNumber).padStart(5, '0')}`;
    } else {
      return `INV-${nextNumber}`;
    }
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback
    return `INV-${Date.now().toString().slice(-5)}`;
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

/**
 * Format invoice number for display
 * Ensures consistent format: INV-XXXXX
 * Handles both new format (INV-12906) and old formats (INV19300, 1M617767967563, etc.)
 */
export function formatInvoiceForDisplay(invoiceNumber: string | null | undefined, fallbackId?: string): string {
  if (!invoiceNumber) {
    // Fallback: use transaction ID if no invoice number
    if (fallbackId) {
      return `INV-${fallbackId.slice(0, 5).toUpperCase()}`;
    }
    return 'INV-????';
  }

  // If already in correct format INV-XXXXX, return as-is
  if (invoiceNumber.match(/^INV-\d+$/)) {
    return invoiceNumber;
  }

  // Extract number and reformat
  const num = extractInvoiceNumber(invoiceNumber);
  if (num > 0) {
    // Format with leading zeros if 4 digits or less
    if (num <= 9999) {
      return `INV-${String(num).padStart(5, '0')}`;
    } else {
      return `INV-${num}`;
    }
  }

  // Ultimate fallback
  return invoiceNumber;
}
