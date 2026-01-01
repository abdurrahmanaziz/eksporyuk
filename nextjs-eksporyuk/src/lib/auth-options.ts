import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { getGoogleOAuthConfig } from '@/lib/integration-config'
import { getNextMemberCode } from '@/lib/member-code'
import { mailketing } from '@/lib/integrations/mailketing'
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
        // Check database first - MUST explicitly select password field
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,  // CRITICAL: Must select password for comparison
            role: true,
            avatar: true,
            username: true,
            whatsapp: true,
            emailVerified: true,
            isSuspended: true,
            suspendReason: true,
            isActive: true,
            affiliateMenuEnabled: true,
            preferredDashboard: true,
          }
        })
        
        // Manual lookup for affiliateProfile (schema has no relations)
        let affiliateProfile = null
        let shouldHaveAffiliateAccess = false
        
        if (user) {
          // Check affiliate profile
          affiliateProfile = await prisma.affiliateProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, isActive: true }
          })
          
          // Auto-determine affiliate access based on:
          // 1. Has affiliate transactions
          // 2. Has affiliate links
          // 3. Has wallet balance
          const [affiliateTransactionCount, affiliateLinksCount, wallet] = await Promise.all([
            prisma.transaction.count({
              where: { 
                affiliateId: user.id,
                status: 'SUCCESS'
              }
            }),
            prisma.affiliateLink.count({
              where: { userId: user.id }
            }),
            prisma.wallet.findUnique({
              where: { userId: user.id },
              select: { balance: true, balancePending: true }
            })
          ])
          
          const hasAffiliateTransactions = affiliateTransactionCount > 0
          const hasAffiliateLinks = affiliateLinksCount > 0
          const hasWalletBalance = wallet && (wallet.balance > 0 || wallet.balancePending > 0)
          
          shouldHaveAffiliateAccess = hasAffiliateTransactions || hasAffiliateLinks || hasWalletBalance || user.affiliateMenuEnabled
          
          console.log('[AUTH] Auto affiliate access check:', {
            userId: user.id,
            hasTransactions: hasAffiliateTransactions,
            hasLinks: hasAffiliateLinks,
            hasWallet: hasWalletBalance,
            currentlyEnabled: user.affiliateMenuEnabled,
            shouldHave: shouldHaveAffiliateAccess
          })
        }

        console.log('[AUTH] Database query result:', {
          found: !!user,
          email: user?.email,
          hasPassword: !!user?.password,
          passwordLength: user?.password?.length || 0,
          role: user?.role,
          isActive: user?.isActive,
          isSuspended: user?.isSuspended
        })

        if (!user) {
          console.log('[AUTH] User not found in database for email:', credentials.email)
          throw new Error('Email tidak terdaftar')
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
          console.log('[AUTH] User has no password - likely Google OAuth account')
          throw new Error('Akun ini terdaftar dengan Google. Silakan login dengan Google.')
        }

        console.log('[AUTH] Comparing password - Input length:', credentials.password.length, 'Stored hash exists:', !!user.password)
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        console.log('[AUTH] Password comparison result:', isPasswordValid)
        
        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password for user:', user.email)
          throw new Error('Password salah. Silakan coba lagi.')
        }

        // Get additional roles for credentials login
        const userRoles = await prisma.userRole.findMany({
          where: { userId: user.id },
          select: { role: true }
        })
        const allRoles = [user.role, ...userRoles.map(ur => ur.role)]
        
        console.log('[AUTH] Login successful for:', user.email, 'Role:', user.role, 'All roles:', allRoles)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          allRoles: allRoles, // NEW: Include all roles
          avatar: user.avatar,
          username: user.username,
          whatsapp: user.whatsapp,
          emailVerified: user.emailVerified,
          affiliateMenuEnabled: shouldHaveAffiliateAccess, // Auto-enable based on commission/wallet
          hasAffiliateProfile: shouldHaveAffiliateAccess || (!!affiliateProfile && affiliateProfile.isActive),
          preferredDashboard: user.preferredDashboard,
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
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/dashboard', // Redirect new OAuth users to dashboard
  },
  debug: process.env.NODE_ENV === 'development', // Enable debugging in development
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      const timestamp = new Date().toISOString()
      console.log(`[AUTH ${timestamp}] ====== signIn callback START ======`)
      console.log(`[AUTH ${timestamp}] Provider:`, account?.provider)
      console.log(`[AUTH ${timestamp}] User email:`, user.email)
      console.log(`[AUTH ${timestamp}] User name:`, user.name)
      console.log(`[AUTH ${timestamp}] User image:`, user.image)
      console.log(`[AUTH ${timestamp}] Account type:`, account?.type)
      
      // Handle Google OAuth sign in
      if (account?.provider === 'google' && user.email) {
        try {
          console.log(`[AUTH ${timestamp}] Processing Google OAuth login...`)
          
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          console.log(`[AUTH ${timestamp}] Google signIn - existing user:`, !!existingUser)
          if (existingUser) {
            console.log(`[AUTH ${timestamp}]   User ID:`, existingUser.id)
            console.log(`[AUTH ${timestamp}]   Username:`, existingUser.username)
            console.log(`[AUTH ${timestamp}]   Role:`, existingUser.role)
            console.log(`[AUTH ${timestamp}]   Is Active:`, existingUser.isActive)
            console.log(`[AUTH ${timestamp}]   Is Suspended:`, existingUser.isSuspended)
          }

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
            
            // Ensure we have a valid name (required field)
            const displayName = user.name || user.email?.split('@')[0] || username
            
            console.log(`[AUTH ${timestamp}] Creating new Google user:`, user.email, 'username:', username, 'name:', displayName)
            
            // Generate member code for new user
            let memberCode = null
            try {
              memberCode = await getNextMemberCode()
              console.log(`[AUTH ${timestamp}] Generated member code:`, memberCode)
            } catch (codeError) {
              console.error(`[AUTH ${timestamp}] Failed to generate member code:`, codeError)
              // Continue without member code - can be generated later
            }
            
            try {
              const newUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: displayName,
                  username: username,
                  avatar: user.image,
                  role: 'MEMBER_FREE',
                  isActive: true,  // CRITICAL: Active by default
                  isSuspended: false,  // CRITICAL: Not suspended
                  emailVerified: true, // Auto-verify Google OAuth users
                  memberCode: memberCode,
                  wallet: {
                    create: {
                      balance: 0,
                      balancePending: 0,
                    },
                  },
                },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  username: true,
                  role: true,
                  memberCode: true,
                  isActive: true,
                  isSuspended: true,
                }
              })
              console.log(`[AUTH ${timestamp}] ✅ New Google user created successfully:`, {
                id: newUser.id,
                email: newUser.email,
                memberCode: newUser.memberCode,
                username: newUser.username,
                isActive: newUser.isActive,
                isSuspended: newUser.isSuspended
              })
              
              // Send welcome email for Google OAuth user
              try {
                await mailketing.sendEmail({
                  to: newUser.email,
                  subject: 'Selamat Datang di EksporYuk!',
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">Selamat Datang!</h1>
                      </div>
                      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px;">Halo <strong>${newUser.name}</strong>,</p>
                        <p style="font-size: 16px;">Terima kasih telah bergabung dengan EksporYuk via Google!</p>
                        <p style="font-size: 16px;">Akun Anda telah berhasil dibuat. Berikut adalah langkah selanjutnya:</p>
                        <ul style="font-size: 14px; color: #4b5563;">
                          <li>Lengkapi profil Anda</li>
                          <li>Pilih membership yang sesuai dengan kebutuhan</li>
                          <li>Mulai belajar ekspor!</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://eksporyuk.com/dashboard" 
                             style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Kunjungi Dashboard
                          </a>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">Jika ada pertanyaan, hubungi kami via WhatsApp atau email.</p>
                        <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
                      </div>
                    </div>
                  `,
                  tags: ['welcome', 'google-oauth']
                })
                console.log(`[AUTH ${timestamp}] ✅ Welcome email sent to Google OAuth user`)
              } catch (emailError) {
                console.error(`[AUTH ${timestamp}] ❌ Failed to send welcome email:`, emailError)
                // Don't block registration if email fails
              }
              
              // Log activity for new user
              try {
                await prisma.activityLog.create({
                  data: {
                    userId: newUser.id,
                    action: 'USER_REGISTERED_OAUTH',
                    entity: 'USER',
                    entityId: newUser.id,
                    metadata: {
                      provider: 'google',
                      email: newUser.email,
                    }
                  },
                })
              } catch (logError) {
                console.error(`[AUTH ${timestamp}] Failed to log activity:`, logError)
              }
              
            } catch (createError: any) {
              console.error(`[AUTH ${timestamp}] ❌ Failed to create Google user:`, createError)
              console.error(`[AUTH ${timestamp}] Prisma error code:`, createError.code)
              console.error(`[AUTH ${timestamp}] Prisma error meta:`, createError.meta)
              console.error(`[AUTH ${timestamp}] Full error:`, JSON.stringify(createError, null, 2))
              
              // If it's a unique constraint violation, user might have been created by another request
              if (createError.code === 'P2002') {
                console.log(`[AUTH ${timestamp}] User already exists (race condition), allowing sign in`)
                return true
              }
              
              // For other errors, block sign in to prevent inconsistent state
              console.error(`[AUTH ${timestamp}] ❌ BLOCKING sign in due to database error`)
              return false
            }
          } else {
            // Check if user is suspended
            if (existingUser.isSuspended) {
              console.log(`[AUTH ${timestamp}] ❌ BLOCKED - Google user is suspended:`, existingUser.suspendReason)
              return false // Block sign in
            }
            
            // Check if user is active
            if (!existingUser.isActive) {
              console.log(`[AUTH ${timestamp}] ❌ BLOCKED - Google user is not active`)
              return false // Block sign in
            }
            
            // Update avatar if user exists but doesn't have one
            if (!existingUser.avatar && user.image) {
              await prisma.user.update({
                where: { email: user.email },
                data: { avatar: user.image }
              })
              console.log(`[AUTH ${timestamp}] Updated user avatar`)
            }
            
            console.log(`[AUTH ${timestamp}] ✅ Google login allowed for existing user`)
          }
        } catch (error) {
          console.error(`[AUTH ${timestamp}] ❌ ERROR in Google signIn callback:`, error)
          console.error(`[AUTH ${timestamp}] Error stack:`, error instanceof Error ? error.stack : 'No stack')
          // Still allow sign in even if database operation fails
          console.log(`[AUTH ${timestamp}] Allowing sign in despite database error`)
        }
      }
      
      console.log(`[AUTH ${timestamp}] ====== signIn callback END - Returning true ======`)
      return true
    },
    async jwt({ token, user, account, profile }) {
      const timestamp = new Date().toISOString()
      console.log(`[AUTH ${timestamp}] ====== JWT callback START ======`)
      console.log(`[AUTH ${timestamp}] Has user object:`, !!user)
      console.log(`[AUTH ${timestamp}] Has account:`, !!account)
      console.log(`[AUTH ${timestamp}] Provider:`, account?.provider)
      console.log(`[AUTH ${timestamp}] Token email:`, token.email)
      
      // First time JWT is created (sign in)
      if (user) {
        console.log(`[AUTH ${timestamp}] JWT - Setting token from user object`)
        token.id = user.id
        token.role = user.role || 'MEMBER_FREE'
        token.allRoles = (user as any).allRoles || [user.role || 'MEMBER_FREE'] // NEW: Include all roles from credentials login
        token.username = user.username || user.email?.split('@')[0]
        token.whatsapp = user.whatsapp
        token.emailVerified = user.emailVerified ? true : false
        token.affiliateMenuEnabled = (user as any).affiliateMenuEnabled || false
        token.hasAffiliateProfile = (user as any).hasAffiliateProfile || false
        token.preferredDashboard = (user as any).preferredDashboard || null
      }
      
      // For Google OAuth, always fetch fresh user data from database
      if (account?.provider === 'google' && token.email) {
        console.log(`[AUTH ${timestamp}] JWT - Google OAuth, fetching user from database`)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
              role: true,
              avatar: true,
              whatsapp: true,
              emailVerified: true,
              memberCode: true,
              // isAuthorizedSupplierReviewer: true,  // Field not in current DB schema
              affiliateMenuEnabled: true,
              preferredDashboard: true,
            }
          })
          
          // Manual lookup for affiliateProfile (schema has no relations)
          let dbAffiliateProfile = null
          let shouldHaveAffiliateAccess = false
          
          if (dbUser) {
            dbAffiliateProfile = await prisma.affiliateProfile.findUnique({
              where: { userId: dbUser.id },
              select: { id: true, isActive: true }
            })
            
            // Auto-determine affiliate access for Google OAuth users
            const [affiliateTransactionCount, affiliateLinksCount, wallet] = await Promise.all([
              prisma.transaction.count({
                where: { 
                  affiliateId: dbUser.id,
                  status: 'SUCCESS'
                }
              }),
              prisma.affiliateLink.count({
                where: { userId: dbUser.id }
              }),
              prisma.wallet.findUnique({
                where: { userId: dbUser.id },
                select: { balance: true, balancePending: true }
              })
            ])
            
            const hasAffiliateTransactions = affiliateTransactionCount > 0
            const hasAffiliateLinks = affiliateLinksCount > 0
            const hasWalletBalance = wallet && (wallet.balance > 0 || wallet.balancePending > 0)
            
            shouldHaveAffiliateAccess = hasAffiliateTransactions || hasAffiliateLinks || hasWalletBalance || dbUser.affiliateMenuEnabled
            
            console.log('[AUTH] Google OAuth auto affiliate access:', {
              userId: dbUser.id,
              hasTransactions: hasAffiliateTransactions,
              hasLinks: hasAffiliateLinks,
              hasWallet: hasWalletBalance,
              currentlyEnabled: dbUser.affiliateMenuEnabled,
              shouldHave: shouldHaveAffiliateAccess
            })
          }
          
          if (dbUser) {
            // Get additional roles from UserRole table
            const userRoles = await prisma.userRole.findMany({
              where: { userId: dbUser.id },
              select: { role: true }
            })
            
            // Create allRoles array (primary + additional)
            const allRoles = [dbUser.role, ...userRoles.map(ur => ur.role)]
            
            console.log(`[AUTH ${timestamp}] JWT - Found user in database:`, {
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
              allRoles: allRoles,
              memberCode: dbUser.memberCode,
              affiliateMenuEnabled: dbUser.affiliateMenuEnabled,
              hasAffiliateProfile: !!dbAffiliateProfile
            })
            
            token.id = dbUser.id
            token.role = dbUser.role
            token.allRoles = allRoles // NEW: Include all roles in token
            token.username = dbUser.username || dbUser.email?.split('@')[0]
            token.whatsapp = dbUser.whatsapp
            token.emailVerified = dbUser.emailVerified
            token.memberCode = dbUser.memberCode
            token.isGoogleAuth = true
            // token.isAuthorizedSupplierReviewer = dbUser.isAuthorizedSupplierReviewer  // Field not in current DB schema
            token.affiliateMenuEnabled = shouldHaveAffiliateAccess // Auto-enable based on commission/wallet
            token.hasAffiliateProfile = shouldHaveAffiliateAccess || (!!dbAffiliateProfile && dbAffiliateProfile.isActive)
            token.preferredDashboard = dbUser.preferredDashboard || null
          } else {
            console.error(`[AUTH ${timestamp}] JWT - User not found in database for email:`, token.email)
          }
        } catch (error) {
          console.error(`[AUTH ${timestamp}] JWT - Error fetching user:`, error)
        }
      }
      
      // Mark Google auth
      if (account?.provider === 'google') {
        token.isGoogleAuth = true
      }
      
      console.log(`[AUTH ${timestamp}] JWT callback END - Token:`, {
        id: token.id,
        email: token.email,
        role: token.role,
        username: token.username,
        isGoogleAuth: token.isGoogleAuth
      })
      
      return token
    },
    async session({ session, token }) {
      const timestamp = new Date().toISOString()
      console.log(`[AUTH ${timestamp}] ====== SESSION callback START ======`)
      console.log(`[AUTH ${timestamp}] Token data:`, {
        id: token.id,
        email: token.email,
        role: token.role,
        username: token.username
      })
      
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.allRoles = token.allRoles as string[] || [token.role as string] // NEW: Include all roles
        session.user.username = token.username as string || ''
        session.user.whatsapp = token.whatsapp as string
        session.user.isGoogleAuth = token.isGoogleAuth as boolean
        session.user.emailVerified = token.emailVerified as boolean || false
        // session.user.isAuthorizedSupplierReviewer = token.isAuthorizedSupplierReviewer as boolean || false  // Field not in current DB schema
        session.user.affiliateMenuEnabled = token.affiliateMenuEnabled as boolean || false
        session.user.hasAffiliateProfile = token.hasAffiliateProfile as boolean || false
        session.user.preferredDashboard = token.preferredDashboard as string || null
        
        console.log(`[AUTH ${timestamp}] SESSION - Set session user:`, {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          allRoles: session.user.allRoles,
          username: session.user.username,
          affiliateMenuEnabled: session.user.affiliateMenuEnabled,
          hasAffiliateProfile: session.user.hasAffiliateProfile
        })
      }
      
      console.log(`[AUTH ${timestamp}] ====== SESSION callback END ======`)
      return session
    },
    async redirect({ url, baseUrl }) {
      const timestamp = new Date().toISOString()
      console.log(`[AUTH ${timestamp}] ====== REDIRECT callback ======`)
      console.log(`[AUTH ${timestamp}] URL: ${url}`)
      console.log(`[AUTH ${timestamp}] Base URL: ${baseUrl}`)
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        const finalUrl = `${baseUrl}${url}`
        console.log(`[AUTH ${timestamp}] Redirecting to relative: ${finalUrl}`)
        return finalUrl
      }
      
      // Handle absolute URLs - only allow same origin
      if (url.startsWith(baseUrl)) {
        console.log(`[AUTH ${timestamp}] Redirecting to same origin: ${url}`)
        return url
      }
      
      // Default to dashboard for successful OAuth
      const defaultUrl = `${baseUrl}/dashboard`
      console.log(`[AUTH ${timestamp}] Defaulting to dashboard: ${defaultUrl}`)
      return defaultUrl
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