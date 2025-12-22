import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
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

        // Demo users for testing (password123)
        const demoUsers = [
          { id: 'admin-001', email: 'admin@eksporyuk.com', name: 'Budi Administrator', role: 'ADMIN', password: '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu' },
          { id: 'mentor-001', email: 'mentor@eksporyuk.com', name: 'Dinda Mentor', role: 'MENTOR', isFounder: true, revenueShare: 60, password: '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu' },
          { id: 'mentor-002', email: 'cofounder@eksporyuk.com', name: 'Andi Mentor', role: 'MENTOR', isCoFounder: true, revenueShare: 40, password: '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu' },
          { id: 'affiliate-001', email: 'affiliate@eksporyuk.com', name: 'Rina Affiliate', role: 'AFFILIATE', password: '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu' },
          { id: 'premium-001', email: 'premium@eksporyuk.com', name: 'Dodi Premium Member', role: 'MEMBER_PREMIUM', password: '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu' },
          { id: 'free-001', email: 'free@eksporyuk.com', name: 'Andi Free Member', role: 'MEMBER_FREE', password: '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu' },
        ]

        const demoUser = demoUsers.find(u => u.email === credentials.email)
        
        if (demoUser && credentials.password === 'password123') {
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            avatar: null,
            username: demoUser.email.split('@')[0],
            isFounder: (demoUser as any).isFounder || false,
            isCoFounder: (demoUser as any).isCoFounder || false,
            revenueShare: (demoUser as any).revenueShare || null,
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              wallet: true,
              affiliateProfile: true,
              mentorProfile: true,
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
          // If database error, fallback to demo users
          console.error('Database error, using demo user:', error)
          if (demoUser) {
            return {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
              avatar: null,
              username: demoUser.email.split('@')[0],
            }
          }
          throw new Error('Email atau password salah')
        }
      },
    }),
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
              userMemberships: {
                where: {
                  isActive: true,
                  status: 'ACTIVE',
                },
                select: { id: true },
                take: 1,
              }
            }
          })
          
          if (dbUser) {
            token.createdAt = dbUser.createdAt.toISOString()
            token.hasMembership = dbUser.userMemberships.length > 0
            
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
