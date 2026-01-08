import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      allRoles?: string[] // NEW: Include all roles array
      avatar?: string | null
      username?: string | null
      whatsapp?: string | null
      isGoogleAuth?: boolean
      emailVerified?: boolean
      isAuthorizedSupplierReviewer?: boolean
      affiliateMenuEnabled?: boolean
      hasAffiliateProfile?: boolean
      preferredDashboard?: string | null
      isBeingImpersonated?: boolean // NEW: Flag for when user is being viewed by admin
      
      // Direct impersonation fields on user
      isImpersonating?: boolean
      impersonationStartedAt?: string
      impersonationReason?: string
      impersonationAdminId?: string
      originalAdmin?: {
        id: string
        email: string
        name: string
        role: string
        username?: string | null
        avatar?: string | null
        whatsapp?: string | null
        emailVerified?: boolean
        memberCode?: string | null
        affiliateMenuEnabled?: boolean
        preferredDashboard?: string | null
        allRoles?: string[]
      }
    }
    createdAt?: string
    trialEndsAt?: string
    hasMembership?: boolean
    impersonation?: { // NEW: Admin impersonation data
      isActive: boolean
      adminId: string
      adminEmail: string
      reason: string
      startedAt: string
      targetUser: {
        id: string
        name: string
        email: string
        role: string
      }
      originalAdmin?: {
        id: string
        email: string
        name: string
        role: string
        username?: string | null
        avatar?: string | null
        whatsapp?: string | null
        emailVerified?: boolean
        memberCode?: string | null
        affiliateMenuEnabled?: boolean
        preferredDashboard?: string | null
        allRoles?: string[]
      }
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    allRoles?: string[] // NEW: Include all roles array
    avatar?: string | null
    username?: string | null
    whatsapp?: string | null
    emailVerified?: boolean
    isAuthorizedSupplierReviewer?: boolean
    affiliateMenuEnabled?: boolean
    hasAffiliateProfile?: boolean
    preferredDashboard?: string | null
    isBeingImpersonated?: boolean // NEW: Flag for impersonation
    
    // Impersonation fields
    isImpersonating?: boolean
    impersonationStartedAt?: string
    impersonationReason?: string
    impersonationAdminId?: string
    originalAdmin?: {
      id: string
      email: string
      name: string
      role: string
      username?: string | null
      avatar?: string | null
      whatsapp?: string | null
      emailVerified?: boolean
      memberCode?: string | null
      affiliateMenuEnabled?: boolean
      preferredDashboard?: string | null
      allRoles?: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    allRoles?: string[] // NEW: Include all roles array
    username?: string | null
    whatsapp?: string | null
    isGoogleAuth?: boolean
    emailVerified?: boolean
    isAuthorizedSupplierReviewer?: boolean
    affiliateMenuEnabled?: boolean
    hasAffiliateProfile?: boolean
    preferredDashboard?: string | null
    createdAt?: string
    trialEndsAt?: string
    hasMembership?: boolean
    // NEW: Admin impersonation fields
    isImpersonating?: boolean
    impersonationReason?: string
    impersonationStartedAt?: string
    impersonationAdminId?: string
    impersonationAdminEmail?: string
    originalAdmin?: {
      id: string
      email: string
      name: string
      role: string
      username?: string | null
      avatar?: string | null
      whatsapp?: string | null
      emailVerified?: boolean
      memberCode?: string | null
      affiliateMenuEnabled?: boolean
      preferredDashboard?: string | null
      allRoles?: string[]
    }
  }
}
