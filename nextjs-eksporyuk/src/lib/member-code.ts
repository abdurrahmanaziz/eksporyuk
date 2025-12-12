/**
 * Helper untuk generate memberCode format EY0001, EY0002, dst
 * Auto-increment based on existing codes
 */

import { prisma } from '@/lib/prisma'

export function formatMemberCode(number: number): string {
  // Format: EY + 4-6 digit (EY0001 sampai EY999999)
  const padLength = number > 9999 ? 6 : 4
  return `EY${number.toString().padStart(padLength, '0')}`
}

export function parseMemberCode(code: string): number | null {
  const match = code.match(/^EY(\d+)$/)
  if (!match) return null
  return parseInt(match[1], 10)
}

export async function getNextMemberCode(): Promise<string> {
  // Get the highest existing memberCode
  const lastUser = await prisma.user.findFirst({
    where: {
      memberCode: {
        not: null,
        startsWith: 'EY'
      }
    },
    orderBy: {
      memberCode: 'desc'
    },
    select: {
      memberCode: true
    }
  })

  let nextNumber = 1

  if (lastUser?.memberCode) {
    const currentNumber = parseMemberCode(lastUser.memberCode)
    if (currentNumber !== null) {
      nextNumber = currentNumber + 1
    }
  }

  return formatMemberCode(nextNumber)
}

export async function assignMemberCode(userId: string, retryCount = 0): Promise<string> {
  const MAX_RETRIES = 5
  
  // Check if user already has memberCode
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberCode: true }
  })

  if (user?.memberCode) {
    return user.memberCode
  }

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get the highest existing memberCode within transaction
      const lastUser = await tx.user.findFirst({
        where: {
          memberCode: {
            not: null,
            startsWith: 'EY'
          }
        },
        orderBy: {
          memberCode: 'desc'
        },
        select: {
          memberCode: true
        }
      })

      let nextNumber = 1

      if (lastUser?.memberCode) {
        const currentNumber = parseMemberCode(lastUser.memberCode)
        if (currentNumber !== null) {
          nextNumber = currentNumber + 1
        }
      }

      const newCode = formatMemberCode(nextNumber)

      // Update user with new code
      await tx.user.update({
        where: { id: userId },
        data: { memberCode: newCode }
      })

      return newCode
    })

    return result
  } catch (error: unknown) {
    // Handle unique constraint violation - retry with new code
    if (
      error && 
      typeof error === 'object' && 
      'code' in error && 
      error.code === 'P2002' && 
      retryCount < MAX_RETRIES
    ) {
      // Wait a bit before retrying to reduce collision chance
      await new Promise(resolve => setTimeout(resolve, 50 * (retryCount + 1)))
      return assignMemberCode(userId, retryCount + 1)
    }
    throw error
  }
}

// Validate memberCode format
export function isValidMemberCode(code: string): boolean {
  return /^EY\d{4,6}$/.test(code)
}

// Search user by memberCode
export async function findUserByMemberCode(code: string) {
  return prisma.user.findUnique({
    where: { memberCode: code },
    select: {
      id: true,
      memberCode: true,
      name: true,
      email: true,
      role: true,
      avatar: true
    }
  })
}
