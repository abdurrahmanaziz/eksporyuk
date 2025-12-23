'use client'

import { signOut, useSession } from 'next-auth/react'
import { Search, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ChatBell from './ChatBell'
import NotificationBell from './NotificationBell'
import Link from 'next/link'
import Image from 'next/image'

export default function DashboardHeader() {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Cari..."
              className="pl-10 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700 text-sm"
            />
          </div>
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Action Buttons */}
        <div className="flex gap-1 sm:gap-2 items-center">
          {/* Chat Bell */}
          <ChatBell />
          
          {/* Notification Bell */}
          <NotificationBell />

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-cover bg-center border-2 border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden ml-1"
          >
            {session?.user?.avatar ? (
              <Image
                src={session.user.avatar}
                alt={session.user.name || 'User'}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1 hidden sm:flex"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span className="text-sm">Keluar</span>
          </Button>
          
          {/* Mobile Logout Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 sm:hidden w-9 h-9"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
