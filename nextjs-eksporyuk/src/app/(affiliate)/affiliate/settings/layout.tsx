'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'
import { User, Wallet, Share2, MessageSquare } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface SettingsTab {
  name: string
  href: string
  icon: React.ReactNode
  description: string
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    name: 'Umum',
    href: '/affiliate/settings',
    icon: <User className="h-5 w-5" />,
    description: 'Profil dan informasi pribadi',
  },
  {
    name: 'Penarikan Dana',
    href: '/affiliate/settings/withdrawal',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Pengaturan penarikan dana',
  },
  {
    name: 'Program Affiliate',
    href: '/affiliate/settings/affiliate',
    icon: <Share2 className="h-5 w-5" />,
    description: 'Pengaturan komisi dan persetujuan',
  },
  {
    name: 'Follow-Up',
    href: '/affiliate/settings/followup',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Pengaturan follow-up leads',
  },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isActiveTab = (href: string) => {
    if (href === '/affiliate/settings') {
      return pathname === '/affiliate/settings'
    }
    return pathname.startsWith(href)
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {SETTINGS_TABS.map((tab) => {
              const active = isActiveTab(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative flex flex-col items-center justify-center p-3 sm:p-4 text-center transition-all border-b-2 ${
                    active
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center text-lg mb-1">
                    {tab.icon}
                  </div>
                  <div className="font-semibold text-xs sm:text-sm">{tab.name}</div>
                  <div className="text-xs text-gray-500 hidden sm:block mt-1">
                    {tab.description}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </ResponsivePageWrapper>
  )
}
