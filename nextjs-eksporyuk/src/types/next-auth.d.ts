import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      avatar?: string | null
      username?: string | null
      whatsapp?: string | null
      isGoogleAuth?: boolean
      emailVerified?: boolean
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
    avatar?: string | null
    username?: string | null
    whatsapp?: string | null
    emailVerified?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    username?: string | null
    whatsapp?: string | null
    isGoogleAuth?: boolean
    emailVerified?: boolean
    createdAt?: string
    trialEndsAt?: string
    hasMembership?: boolean
  }
}
