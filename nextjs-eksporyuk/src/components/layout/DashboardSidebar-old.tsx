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
  Radio,
  BarChart3,
  Gamepad2,
  FileText,
  Mail,
  MessageCircle,
  Plug,
  Key,
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

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {!isCollapsed && (
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                Eksporyuk
              </Link>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

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
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userRole.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className={cn(isCollapsed ? 'w-16' : 'w-64')} />
    </>
  )
}
