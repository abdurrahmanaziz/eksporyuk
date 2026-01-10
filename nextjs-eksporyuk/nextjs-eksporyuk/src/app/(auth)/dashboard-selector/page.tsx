import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import DashboardSelector from '@/components/dashboard/DashboardSelector'

export default async function DashboardSelectorPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  const userRole = session.user.role
  
  // Admin goes straight to admin panel - no selection needed
  if (userRole === 'ADMIN') {
    redirect('/admin')
  }
  
  // Supplier goes straight to supplier panel
  if (userRole === 'SUPPLIER') {
    redirect('/supplier/dashboard')
  }
  
  // Check if user needs dashboard selection
  const needsSelection = checkIfNeedsDashboardSelection(userRole, session.user)
  
  if (!needsSelection) {
    // Auto-redirect single-role users
    const redirectUrl = getDefaultDashboardForRole(userRole)
    redirect(redirectUrl)
  }
  
  return <DashboardSelector />
}

/**
 * Determine if user needs to choose dashboard
 * Must match middleware logic exactly
 */
function checkIfNeedsDashboardSelection(role: string, user: any): boolean {
  // Admin and Supplier - no selection (handled above, but double-check)
  if (role === 'ADMIN' || role === 'SUPPLIER') return false
  
  // Check for multi-role scenarios
  const hasAffiliateAccess = user.affiliateMenuEnabled && user.hasAffiliateProfile
  const isAffiliate = role === 'AFFILIATE'
  const hasMentorAccess = role === 'MENTOR'
  const hasMemberAccess = ['MEMBER_FREE', 'MEMBER_PREMIUM'].includes(role)
  
  // Count available dashboards
  let dashboardCount = 0
  
  // Member dashboard available for members, affiliates, and mentors
  if (hasMemberAccess || isAffiliate || hasMentorAccess) dashboardCount++
  
  // Affiliate dashboard - count only if ACTUALLY has affiliate access
  if (isAffiliate || hasAffiliateAccess) dashboardCount++
  
  // Mentor dashboard  
  if (hasMentorAccess) dashboardCount++
  
  return dashboardCount > 1
}

/**
 * Get default dashboard URL for single-role users
 */
function getDefaultDashboardForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'MENTOR':
      return '/mentor/dashboard'
    case 'AFFILIATE':
      return '/affiliate/dashboard'
    case 'SUPPLIER':
      return '/supplier/dashboard'
    case 'MEMBER_PREMIUM':
    case 'MEMBER_FREE':
    default:
      return '/dashboard?selected=member'
  }
}