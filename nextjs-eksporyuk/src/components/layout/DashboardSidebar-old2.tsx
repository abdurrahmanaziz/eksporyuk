'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { getRoleTheme } from '@/lib/role-themes'
import {
  Home,
  Users,
  ShoppingBag,
  UsersRound,
  Calendar,
  BookOpen,
  Share2,
  Tag,
  Briefcase,
  Wallet,
  Settings,
  MessageSquare,
  BarChart3,
  Gamepad2,
  Plug,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navigation = {
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Membership', href: '/dashboard/membership', icon: Briefcase },
    { name: 'Products', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'Groups', href: '/dashboard/groups', icon: UsersRound },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Affiliates', href: '/dashboard/affiliates', icon: Share2 },
    { name: 'Coupons', href: '/dashboard/coupons', icon: Tag },
    { name: 'Financials', href: '/dashboard/financials', icon: Wallet },
    { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  FOUNDER: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Membership', href: '/dashboard/membership', icon: Briefcase },
    { name: 'Products', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'Financials', href: '/dashboard/financials', icon: Wallet },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  CO_FOUNDER: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Products', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'Financials', href: '/dashboard/financials', icon: Wallet },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  MENTOR: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'My Products', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'My Groups', href: '/dashboard/groups', icon: UsersRound },
    { name: 'Students', href: '/dashboard/students', icon: Users },
    { name: 'Earnings', href: '/dashboard/earnings', icon: Wallet },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  AFFILIATE: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Links', href: '/dashboard/affiliate/links', icon: Share2 },
    { name: 'Statistics', href: '/dashboard/affiliate/stats', icon: BarChart3 },
    { name: 'Earnings', href: '/dashboard/affiliate/earnings', icon: Wallet },
    { name: 'Challenges', href: '/dashboard/affiliate/challenges', icon: Gamepad2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  MEMBER_PREMIUM: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Feed', href: '/dashboard/feed', icon: MessageSquare },
    { name: 'My Groups', href: '/dashboard/groups', icon: UsersRound },
    { name: 'My Courses', href: '/dashboard/my-courses', icon: BookOpen },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  MEMBER_FREE: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Feed', href: '/dashboard/feed', icon: MessageSquare },
    { name: 'Upgrade', href: '/dashboard/upgrade', icon: Briefcase },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
}

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const userRole = session?.user?.role || 'MEMBER_FREE'
  const navItems = navigation[userRole as keyof typeof navigation] || navigation.MEMBER_FREE
  const theme = getRoleTheme(userRole)

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo with Theme Color */}
          <div 
            className="flex items-center justify-between h-16 px-4 border-b transition-all"
            style={{ 
              borderBottomColor: theme.primary,
              backgroundColor: theme.primary + '08'
            }}
          >
            {!isCollapsed && (
              <Link href="/dashboard" className="text-lg font-bold flex items-center gap-2" style={{ color: theme.primary }}>
                <span className="text-xl">{theme.icon}</span>
                <span>Eksporyuk</span>
              </Link>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Role Info - Collapsed */}
          {isCollapsed && (
            <div className="p-3 border-b border-gray-200 text-center text-xs font-semibold" style={{ color: theme.primary }}>
              {theme.icon}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  style={isActive ? { backgroundColor: theme.primary } : {}}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: theme.primary }}
              >
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{theme.slug}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
