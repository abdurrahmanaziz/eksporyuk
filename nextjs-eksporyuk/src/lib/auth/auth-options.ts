import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi')
        }

        // Always try database first
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user) {
            throw new Error('Email atau password salah')
          }

          if (!user.isActive) {
            throw new Error('Akun Anda telah dinonaktifkan')
          }

          if (!user.password) {
            throw new Error('Akun tidak memiliki password')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Email atau password salah')
          }

          // Update last seen
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              isOnline: true,
              lastSeenAt: new Date(),
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            username: user.username,
          }
        } catch (error) {
          console.error('Database error:', error)
          throw new Error('Email atau password salah')
        }
      },
    }),
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? (() => {
      console.log('[AUTH-OPTIONS] Google OAuth enabled - Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...')
      return [GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code'
          }
        }
      })]
    })() : (() => {
      console.log('[AUTH-OPTIONS] Google OAuth NOT enabled - missing credentials')
      return []
    })()),
    // Facebook OAuth Provider
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? (() => {
      console.log('[AUTH-OPTIONS] Facebook OAuth enabled - App ID:', process.env.FACEBOOK_CLIENT_ID)
      return [FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      })]
    })() : (() => {
      console.log('[AUTH-OPTIONS] Facebook OAuth NOT enabled - FACEBOOK_CLIENT_ID:', !!process.env.FACEBOOK_CLIENT_ID, 'FACEBOOK_CLIENT_SECRET:', !!process.env.FACEBOOK_CLIENT_SECRET)
      return []
    })()),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
        
        // Fetch user details for trial tracking
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              createdAt: true,
              role: true,
            }
          })
          
          if (dbUser) {
            // Check membership separately - UserMembership has no relation defined
            const activeMembership = await prisma.userMembership.findFirst({
              where: {
                userId: user.id,
                isActive: true,
                status: 'ACTIVE',
              },
              select: { id: true },
            })
            
            token.createdAt = dbUser.createdAt.toISOString()
            token.hasMembership = !!activeMembership
            
            // Calculate trial end date (3 days from registration)
            const trialEnd = new Date(dbUser.createdAt)
            trialEnd.setDate(trialEnd.getDate() + 3)
            token.trialEndsAt = trialEnd.toISOString()
          }
        } catch (error) {
          console.error('[JWT] Error fetching user details:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
        
        // Add trial info to session
        session.createdAt = token.createdAt as string
        session.trialEndsAt = token.trialEndsAt as string
        session.hasMembership = token.hasMembership as boolean

        // Auto-create user in database jika belum ada (safety measure)
        try {
          // Check by email first to avoid unique constraint error
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { id: token.id as string },
                { email: session.user.email || '' }
              ]
            },
            select: {
              id: true,
              email: true
            }
          })

          if (!existingUser && session.user.email) {
            console.log(`[Session] Auto-creating user: ${session.user.email}`)
            await prisma.user.create({
              data: {
                id: token.id as string,
                email: session.user.email,
                name: session.user.name || 'User',
                role: (token.role as any) || 'MEMBER_FREE',
                emailVerified: true,
                avatar: token.avatar as string | null | undefined,
                wallet: {
                  create: {
                    balance: 0,
                  },
                },
              },
            })
          }
        } catch (error) {
          // Silently fail - user might already exist from another session
          if ((error as any)?.code !== 'P2002') {
            console.error(`[Session] Failed to auto-create user:`, error)
          }
        }
      }
      return session
    },
  },
}
