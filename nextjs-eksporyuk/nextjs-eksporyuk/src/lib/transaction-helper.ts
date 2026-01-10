/**
 * Transaction Helper - Auto-generate transaction IDs
 */

/**
 * Generate unique transaction ID
 * Format: txn_timestamp_randomstring
 */
export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get current timestamp for updatedAt field
 */
export function getCurrentTimestamp(): Date {
  return new Date()
}
