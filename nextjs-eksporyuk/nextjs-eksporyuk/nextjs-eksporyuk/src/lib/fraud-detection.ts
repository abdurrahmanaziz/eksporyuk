import { prisma } from '@/lib/prisma'

interface FraudCheckResult {
  isFraud: boolean
  reason?: string
  severity: 'low' | 'medium' | 'high'
}

export async function checkAffiliateFraud(
  affiliateUserId: string,
  buyerEmail: string,
  buyerName: string,
  buyerWhatsapp?: string,
  buyerIpAddress?: string
): Promise<FraudCheckResult> {
  
  try {
    // Get affiliate user data
    const affiliate = await prisma.user.findUnique({
      where: { id: affiliateUserId },
      select: {
        email: true,
        name: true,
        whatsapp: true,
      }
    })

    if (!affiliate) {
      return { isFraud: false, severity: 'low' }
    }

    // 1. Check: Same email
    if (affiliate.email.toLowerCase() === buyerEmail.toLowerCase()) {
      return {
        isFraud: true,
        reason: 'SELF_PURCHASE: Email pembeli sama dengan email affiliate',
        severity: 'high'
      }
    }

    // 2. Check: Similar email (same domain/prefix)
    const affiliateEmailPrefix = affiliate.email.split('@')[0]
    const buyerEmailPrefix = buyerEmail.split('@')[0]
    const affiliateEmailDomain = affiliate.email.split('@')[1]
    const buyerEmailDomain = buyerEmail.split('@')[1]

    if (affiliateEmailDomain === buyerEmailDomain && 
        levenshteinDistance(affiliateEmailPrefix, buyerEmailPrefix) <= 2) {
      return {
        isFraud: true,
        reason: 'SIMILAR_EMAIL: Email pembeli terlalu mirip dengan affiliate',
        severity: 'high'
      }
    }

    // 3. Check: Same WhatsApp number
    if (buyerWhatsapp && affiliate.whatsapp) {
      const cleanAffiliateWA = affiliate.whatsapp.replace(/\D/g, '')
      const cleanBuyerWA = buyerWhatsapp.replace(/\D/g, '')
      
      if (cleanAffiliateWA === cleanBuyerWA) {
        return {
          isFraud: true,
          reason: 'SAME_WHATSAPP: Nomor WhatsApp pembeli sama dengan affiliate',
          severity: 'high'
        }
      }
    }

    // 4. Check: Same or very similar name
    const nameSimilarity = stringSimilarity(
      affiliate.name?.toLowerCase() || '',
      buyerName.toLowerCase()
    )
    
    if (nameSimilarity > 0.8) {
      return {
        isFraud: true,
        reason: 'SIMILAR_NAME: Nama pembeli sangat mirip dengan affiliate',
        severity: 'medium'
      }
    }

    // 5. Check: Repeated purchases from same buyer
    const previousPurchases = await prisma.transaction.count({
      where: {
        affiliateCode: affiliateUserId,
        email: buyerEmail,
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    if (previousPurchases >= 3) {
      return {
        isFraud: true,
        reason: 'EXCESSIVE_REPEAT: Pembeli yang sama sudah melakukan 3+ pembelian dalam 30 hari',
        severity: 'medium'
      }
    }

    // 6. Check: Same IP address (if provided)
    if (buyerIpAddress) {
      const recentTransactionsFromIP = await prisma.transaction.count({
        where: {
          affiliateCode: affiliateUserId,
          // ipAddress: buyerIpAddress, // Uncomment jika field ini ada
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (recentTransactionsFromIP >= 2) {
        return {
          isFraud: true,
          reason: 'SAME_IP: Multiple transaksi dari IP address yang sama dalam 24 jam',
          severity: 'high'
        }
      }
    }

    // All checks passed
    return { isFraud: false, severity: 'low' }

  } catch (error) {
    console.error('Error checking fraud:', error)
    // On error, allow transaction but log for manual review
    return { isFraud: false, severity: 'low' }
  }
}

// Helper: Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Helper: Calculate string similarity (0-1)
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

// Log fraud attempt
export async function logFraudAttempt(
  affiliateUserId: string,
  reason: string,
  severity: 'low' | 'medium' | 'high',
  details: any
) {
  try {
    // Create fraud log (you may need to create this model)
    // await prisma.fraudLog.create({
    //   data: {
    //     userId: affiliateUserId,
    //     reason,
    //     severity,
    //     details: JSON.stringify(details),
    //   }
    // })

    console.error('🚨 FRAUD DETECTED:', {
      userId: affiliateUserId,
      reason,
      severity,
      details,
    })

    // If high severity, automatically suspend affiliate
    if (severity === 'high') {
      await prisma.user.update({
        where: { id: affiliateUserId },
        data: {
          // isAffiliateSuspended: true, // Uncomment if field exists
          // suspensionReason: reason,
        }
      })
    }
  } catch (error) {
    console.error('Error logging fraud:', error)
  }
}
