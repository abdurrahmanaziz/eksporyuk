import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { getGoogleOAuthConfig } from '@/lib/integration-config'
import bcrypt from 'bcryptjs'

// Conditionally include Google provider only if credentials are configured
const providers: any[] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      console.log('[AUTH] Authorize called with email:', credentials?.email)
      
      if (!credentials?.email || !credentials?.password) {
        console.log('[AUTH] Missing credentials')
        throw new Error('Email dan password harus diisi')
      }

      try {
        // Check database first
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        console.log('[AUTH] User found:', !!user, 'Has password:', !!user?.password)

        if (!user) {
          console.log('[AUTH] User not found')
          throw new Error('User tidak ditemukan')
        }

        // Check if user is suspended
        if (user.isSuspended) {
          console.log('[AUTH] User is suspended:', user.suspendReason)
          throw new Error(`Akun Anda disuspend. Alasan: ${user.suspendReason || 'Pelanggaran ketentuan'}`)
        }

        // Check if user is active
        if (!user.isActive) {
          console.log('[AUTH] User is not active')
          throw new Error('Akun Anda tidak aktif. Silakan hubungi admin.')
        }

        if (!user.password) {
          console.log('[AUTH] User has no password')
          throw new Error('Akun ini menggunakan metode login lain')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        console.log('[AUTH] Password valid:', isPasswordValid)
        
        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password')
          throw new Error('Password salah')
        }

        console.log('[AUTH] Login successful for:', user.email, 'Role:', user.role)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          username: user.username,
          whatsapp: user.whatsapp,
          emailVerified: user.emailVerified,
        }
      } catch (error: any) {
        console.error('[AUTH] Authorization error:', error.message)
        throw error
      }
    },
  }),
]

// Add Google provider only if credentials are configured
// Note: NextAuth providers are loaded at startup, so we use environment variables
// The database config is checked at runtime in signIn callback
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('[AUTH-OPTIONS] Google OAuth enabled - Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...')
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  )
} else {
  console.log('[AUTH-OPTIONS] Google OAuth NOT enabled - Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment')
  console.log('[AUTH-OPTIONS] To enable Google OAuth, either:')
  console.log('[AUTH-OPTIONS]   1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env')
  console.log('[AUTH-OPTIONS]   2. Configure in Admin > Integrations page (requires restart)')
}
console.log('[AUTH-OPTIONS] Total providers configured:', providers.length)

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error('[AUTH-OPTIONS] ERROR: NEXTAUTH_SECRET or AUTH_SECRET must be set!')
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debugging in development
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] signIn callback - provider:', account?.provider, 'email:', user.email)
      
      // Handle Google OAuth sign in
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          console.log('[AUTH] Google signIn - existing user:', !!existingUser)

          if (!existingUser) {
            // Create new user from Google OAuth
            const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
            let username = baseUsername
            let counter = 1
            
            // Ensure unique username
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`
              counter++
            }
            
            console.log('[AUTH] Creating new Google user:', user.email, 'username:', username)
            
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || username,
                username: username,
                avatar: user.image,
                role: 'MEMBER_FREE',
                isActive: true,
                // No password for OAuth users
              }
            })
            console.log('[AUTH] New Google user created successfully')
          } else {
            // Check if user is suspended
            if (existingUser.isSuspended) {
              console.log('[AUTH] Google user is suspended:', existingUser.suspendReason)
              return false // Block sign in
            }
            
            // Check if user is active
            if (!existingUser.isActive) {
              console.log('[AUTH] Google user is not active')
              return false // Block sign in
            }
            
            // Update avatar if user exists but doesn't have one
            if (!existingUser.avatar && user.image) {
              await prisma.user.update({
                where: { email: user.email },
                data: { avatar: user.image }
              })
            }
          }
        } catch (error) {
          console.error('[AUTH] Error creating/updating Google user:', error)
          // Still allow sign in even if database operation fails
        }
      }
      
      return true
    },
    async jwt({ token, user, account, profile }) {
      // First time JWT is created (sign in)
      if (user) {
        token.id = user.id
        token.role = user.role || 'MEMBER_FREE'
        token.username = user.username || user.email?.split('@')[0]
        token.whatsapp = user.whatsapp
        token.emailVerified = user.emailVerified ? true : false
      }
      
      // For Google OAuth, fetch user from database
      if (account?.provider === 'google' && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email }
          })
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.username = dbUser.username
            token.whatsapp = dbUser.whatsapp
            token.emailVerified = dbUser.emailVerified
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error)
        }
      }
      
      if (account?.provider === 'google') {
        token.isGoogleAuth = true
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string || ''
        session.user.whatsapp = token.whatsapp as string
        session.user.isGoogleAuth = token.isGoogleAuth as boolean
        session.user.emailVerified = token.emailVerified as boolean || false
      }
      return session
    },
  },
  events: {
    async signOut({ token }) {
      // Clear any cached data on signout
      console.log('User signed out:', token?.email)
    },
  },
  // Handle JWT decryption errors gracefully
  logger: {
    error(code, ...message) {
      if (code === 'JWT_SESSION_ERROR') {
        console.error('JWT Session Error - User needs to login again')
      } else {
        console.error(code, message)
      }
    },
    warn(code, ...message) {
      // Suppress debug warnings in production
      if (process.env.NODE_ENV === 'production' && code === 'DEBUG_ENABLED') {
        return
      }
      console.warn(code, message)
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(code, message)
      }
    },
  },
}