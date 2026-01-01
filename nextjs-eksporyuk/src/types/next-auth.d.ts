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
    }
    createdAt?: string
    trialEndsAt?: string
    hasMembership?: boolean
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
  }
}
