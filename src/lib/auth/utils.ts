import { getServerSession } from 'next-auth'
import { authOptions } from '../auth-options'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}

export function isAdmin(role: string): boolean {
  return ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(role)
}

export function isMentor(role: string): boolean {
  return role === 'MENTOR' || isAdmin(role)
}

export function isAffiliate(role: string): boolean {
  return role === 'AFFILIATE' || isAdmin(role)
}

export function isPremiumMember(role: string): boolean {
  return role === 'MEMBER_PREMIUM' || isAdmin(role) || isMentor(role)
}
