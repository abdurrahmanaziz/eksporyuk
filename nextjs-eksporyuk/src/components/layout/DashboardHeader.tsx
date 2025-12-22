'use client'

import { signOut, useSession } from 'next-auth/react'
import { Search, LogOut, LayoutDashboard, Users, GraduationCap, Calendar, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRoleTheme } from '@/lib/role-themes'
import ChatBell from './ChatBell'
import NotificationBell from './NotificationBell'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function DashboardHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const userRole = session?.user?.role || 'MEMBER_FREE'
  const theme = getRoleTheme(userRole)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Navigation items
  const navItems = [
    { href: '/dashboard/member', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/community', label: 'Komunitas', icon: Users },
    { href: '/dashboard/my-courses', label: 'Pembelajaran', icon: GraduationCap },
    { href: '/dashboard/my-events', label: 'Event', icon: Calendar },
    { href: '/dashboard/my-products', label: 'Toko', icon: ShoppingBag },
  ]

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 sm:px-10 py-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 text-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight hidden sm:block">
              Portal Member
            </h2>
          </div>

          {/* Search - Desktop */}
          <div className="hidden md:flex">
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari"
                className="pl-11 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex flex-1 justify-end gap-4 lg:gap-8 items-center">
          {/* Navigation Menu - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-9">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium leading-normal transition-colors flex items-center gap-2 ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center">
            {/* Chat Bell */}
            <ChatBell />
            
            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar */}
            <Link
              href="/dashboard/profile"
              className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden"
            >
              {session?.user?.avatar ? (
                <Image
                  src={session.user.avatar}
                  alt={session.user.name || 'User'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Bottom of header */}
      <div className="lg:hidden border-t border-gray-200 dark:border-gray-800">
        <nav className="flex items-center justify-around px-2 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg min-w-[60px] ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
