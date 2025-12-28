import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import DashboardSelector from '@/components/dashboard/DashboardSelector'

export default async function DashboardSelectorPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  const userRole = session.user.role
  
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
 */
function checkIfNeedsDashboardSelection(role: string, user: any): boolean {
  // Admin always gets choice (can act as any role)
  if (role === 'ADMIN') return true
  
  // Check for multi-role scenarios
  const hasAffiliateAccess = user.affiliateMenuEnabled && user.hasAffiliateProfile
  const hasMentorAccess = role === 'MENTOR'
  const hasMemberAccess = ['MEMBER_FREE', 'MEMBER_PREMIUM'].includes(role)
  
  // Count available dashboards
  let dashboardCount = 0
  if (hasMemberAccess || role === 'AFFILIATE' || role === 'MENTOR') dashboardCount++
  if (hasAffiliateAccess || role === 'AFFILIATE') dashboardCount++
  if (hasMentorAccess) dashboardCount++
  if (role === 'ADMIN') dashboardCount++
  
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
    case 'MEMBER_PREMIUM':
    case 'MEMBER_FREE':
    default:
      return '/dashboard'
  }
}