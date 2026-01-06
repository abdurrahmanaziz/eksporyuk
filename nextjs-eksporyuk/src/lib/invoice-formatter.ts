/**
 * Extract numeric part from any invoice format
 * Handles: INV-0001, INV19300, 1M617767967563, etc.
 * Client-safe utility (no Prisma)
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
 * Format invoice number for display
 * Ensures consistent format: INV-XXXXX
 * Handles both new format (INV-12906) and old formats (INV19300, 1M617767967563, etc.)
 * 
 * Client-safe: no external dependencies
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
