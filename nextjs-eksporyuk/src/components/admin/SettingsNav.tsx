'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Palette,
  DollarSign,
  UserPlus,
  MessageSquare,
  CreditCard,
  BookOpen,
  Zap,
} from 'lucide-react'

const settingsPages = [
  {
    name: 'Umum',
    href: '/admin/settings',
    icon: Settings,
    description: 'Info website, logo, sosmed',
  },
  {
    name: 'Branding',
    href: '/admin/settings/branding',
    icon: Palette,
    description: 'Warna brand & tombol',
  },
  {
    name: 'Pembayaran',
    href: '/admin/settings/payment',
    icon: CreditCard,
    description: 'Xendit, bank accounts',
  },
  {
    name: 'Penarikan',
    href: '/admin/settings/withdrawal',
    icon: DollarSign,
    description: 'Komisi & withdrawal',
  },
  {
    name: 'Affiliate',
    href: '/admin/settings/affiliate',
    icon: UserPlus,
    description: 'Komisi & approval',
  },
  {
    name: 'Follow Up',
    href: '/admin/settings/followup',
    icon: MessageSquare,
    description: 'Template WhatsApp',
  },
  {
    name: 'Kursus',
    href: '/admin/settings/course',
    icon: BookOpen,
    description: 'Sertifikat & akses',
  },
  {
    name: 'Platform',
    href: '/admin/settings/platform',
    icon: Zap,
    description: 'Fitur & integrasi',
  },
]

export default function SettingsNav() {
  const pathname = usePathname()

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {settingsPages.map((page) => {
            const isActive = pathname === page.href
            const Icon = page.icon

            return (
              <Link
                key={page.href}
                href={page.href}
                className={`group relative p-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        isActive ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {page.name}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 hidden lg:block">
                      {page.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
