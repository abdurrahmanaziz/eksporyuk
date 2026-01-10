/**
 * Commission conversion utilities for automatic rate calculation
 */

export interface CommissionConversion {
  originalType: 'FLAT' | 'PERCENTAGE'
  originalRate: number
  targetType: 'FLAT' | 'PERCENTAGE'
  targetRate: number
  productPrice: number
  equivalentPercentage?: number
  equivalentFlat?: number
}

/**
 * Convert commission rate between FLAT and PERCENTAGE
 */
export function convertCommissionRate(
  originalRate: number,
  originalType: 'FLAT' | 'PERCENTAGE',
  targetType: 'FLAT' | 'PERCENTAGE',
  productPrice: number
): number {
  if (originalType === targetType) {
    return originalRate
  }

  if (originalType === 'PERCENTAGE' && targetType === 'FLAT') {
    // Convert percentage to flat amount
    return (productPrice * originalRate) / 100
  }

  if (originalType === 'FLAT' && targetType === 'PERCENTAGE') {
    // Convert flat amount to percentage
    return (originalRate / productPrice) * 100
  }

  return originalRate
}

/**
 * Calculate equivalent rates for display purposes
 */
export function calculateEquivalentRates(
  rate: number,
  commissionType: 'FLAT' | 'PERCENTAGE',
  productPrice: number
): CommissionConversion {
  const equivalentPercentage = commissionType === 'FLAT' 
    ? (rate / productPrice) * 100
    : rate

  const equivalentFlat = commissionType === 'PERCENTAGE'
    ? (productPrice * rate) / 100
    : rate

  return {
    originalType: commissionType,
    originalRate: rate,
    targetType: commissionType === 'FLAT' ? 'PERCENTAGE' : 'FLAT',
    targetRate: commissionType === 'FLAT' 
      ? equivalentPercentage
      : equivalentFlat,
    productPrice,
    equivalentPercentage,
    equivalentFlat
  }
}

/**
 * Validate commission rate based on type and product price
 */
export function validateCommissionRate(
  rate: number,
  commissionType: 'FLAT' | 'PERCENTAGE',
  productPrice: number
): { isValid: boolean; error?: string } {
  if (rate < 0) {
    return { isValid: false, error: 'Commission rate cannot be negative' }
  }

  if (commissionType === 'PERCENTAGE') {
    if (rate > 100) {
      return { isValid: false, error: 'Percentage commission cannot exceed 100%' }
    }
  }

  if (commissionType === 'FLAT') {
    if (rate > productPrice) {
      return { 
        isValid: false, 
        error: `FLAT commission (Rp ${rate.toLocaleString('id-ID')}) cannot exceed product price (Rp ${productPrice.toLocaleString('id-ID')})` 
      }
    }
  }

  return { isValid: true }
}

/**
 * Format commission rate for display
 */
export function formatCommissionRate(
  rate: number,
  commissionType: 'FLAT' | 'PERCENTAGE'
): string {
  if (commissionType === 'FLAT') {
    return `Rp ${rate.toLocaleString('id-ID')}`
  }
  return `${rate}%`
}

/**
 * Get suggested rates based on product price and industry standards
 */
export function getSuggestedRates(productPrice: number): {
  conservative: { flat: number; percentage: number }
  moderate: { flat: number; percentage: number }
  aggressive: { flat: number; percentage: number }
} {
  return {
    conservative: {
      flat: Math.round(productPrice * 0.1), // 10%
      percentage: 10
    },
    moderate: {
      flat: Math.round(productPrice * 0.2), // 20%
      percentage: 20
    },
    aggressive: {
      flat: Math.round(productPrice * 0.3), // 30%
      percentage: 30
    }
  }
}

/**
 * Bulk conversion utility for multiple items
 */
export function bulkConvertCommissions(
  items: Array<{
    id: string
    price: number
    commissionType: 'FLAT' | 'PERCENTAGE'
    affiliateCommissionRate: number
  }>,
  targetType: 'FLAT' | 'PERCENTAGE'
): Array<{
  id: string
  originalRate: number
  newRate: number
  conversion: CommissionConversion
}> {
  return items.map(item => {
    const newRate = convertCommissionRate(
      item.affiliateCommissionRate,
      item.commissionType,
      targetType,
      item.price
    )

    const conversion = calculateEquivalentRates(
      item.affiliateCommissionRate,
      item.commissionType,
      item.price
    )

    return {
      id: item.id,
      originalRate: item.affiliateCommissionRate,
      newRate,
      conversion
    }
  })
}