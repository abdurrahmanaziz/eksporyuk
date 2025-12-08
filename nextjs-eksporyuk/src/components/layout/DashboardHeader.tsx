'use client'

import { signOut, useSession } from 'next-auth/react'
import { Search, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRoleTheme } from '@/lib/role-themes'
import ChatBell from './ChatBell'
import NotificationBell from './NotificationBell'

export default function DashboardHeader() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'MEMBER_FREE'
  const theme = getRoleTheme(userRole)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: theme.primary + '20' }}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-2 sm:gap-4">
        {/* Search - Hidden on small mobile, visible on larger screens */}
        <div className="hidden sm:flex flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Mobile Search Icon */}
        <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100">
          <Search className="w-5 h-5 text-gray-600" />
        </button>

        {/* Spacer for mobile */}
        <div className="flex-1 sm:hidden"></div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Messages */}
          <ChatBell />
          
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{session?.user?.name}</p>
              <p className="text-xs truncate max-w-[150px]" style={{ color: theme.primary }}>
                {session?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign Out"
              className="transition-colors hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" style={{ color: theme.primary }} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
