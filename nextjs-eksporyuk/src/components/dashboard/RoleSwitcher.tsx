'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  User, DollarSign, GraduationCap, Shield, ChevronDown,
  ArrowLeftRight, Check
} from 'lucide-react'

interface DashboardOption {
  id: string
  title: string
  description: string
  href: string
  icon: string
  color: string
  bgColor: string
}

// Map icon string to component
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  DollarSign,
  GraduationCap,
  Shield
}

// Dashboard theme colors
const dashboardThemes: Record<string, {
  primary: string
  accent: string
  bg: string
  hover: string
  text: string
  border: string
}> = {
  member: {
    primary: 'text-blue-600',
    accent: 'bg-blue-600',
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  affiliate: {
    primary: 'text-emerald-600',
    accent: 'bg-emerald-600',
    bg: 'bg-emerald-50',
    hover: 'hover:bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  mentor: {
    primary: 'text-purple-600',
    accent: 'bg-purple-600',
    bg: 'bg-purple-50',
    hover: 'hover:bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200'
  },
  admin: {
    primary: 'text-red-600',
    accent: 'bg-red-600',
    bg: 'bg-red-50',
    hover: 'hover:bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  }
}

interface RoleSwitcherProps {
  collapsed?: boolean
}

export default function RoleSwitcher({ collapsed = false }: RoleSwitcherProps) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Determine current dashboard from pathname
  const getCurrentDashboard = (): string => {
    if (pathname?.startsWith('/admin')) return 'admin'
    if (pathname?.startsWith('/affiliate')) return 'affiliate'
    if (pathname?.startsWith('/mentor')) return 'mentor'
    return 'member'
  }

  const currentDashboard = getCurrentDashboard()
  const currentTheme = dashboardThemes[currentDashboard] || dashboardThemes.member

  // Fetch dashboard options
  useEffect(() => {
    const fetchOptions = async () => {
      if (!session?.user?.id || status !== 'authenticated') return

      try {
        const res = await fetch('/api/user/dashboard-options')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.dashboardOptions) {
            setDashboardOptions(data.dashboardOptions)
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard options:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [session?.user?.id, status])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle switch
  const handleSwitch = async (option: DashboardOption) => {
    if (option.id === currentDashboard || switching) return

    setSwitching(true)
    setIsOpen(false)

    try {
      // Save preferred dashboard to database
      await fetch('/api/user/preferred-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard: option.id })
      })

      // Update session to reflect new preferredDashboard immediately
      // This triggers JWT callback to fetch fresh data from DB
      await update({ preferredDashboard: option.id })

      // Navigate to the selected dashboard
      router.push(option.href)
    } catch (error) {
      console.error('Failed to switch dashboard:', error)
    } finally {
      setSwitching(false)
    }
  }

  // Don't render if loading or user has only 1 dashboard option
  if (isLoading || dashboardOptions.length <= 1) {
    return null
  }

  const currentOption = dashboardOptions.find(o => o.id === currentDashboard)
  const CurrentIcon = currentOption ? iconMap[currentOption.icon] || User : User

  // Collapsed view - just show icon with tooltip
  if (collapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={switching}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg transition-all',
            currentTheme.bg,
            currentTheme.hover,
            currentTheme.border,
            'border',
            switching && 'opacity-50 cursor-wait'
          )}
          title="Ganti Dashboard"
        >
          <ArrowLeftRight className={cn('w-5 h-5', currentTheme.primary)} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute left-12 bottom-0 z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in slide-in-from-left-2">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ganti Dashboard</p>
            </div>
            {dashboardOptions.map((option) => {
              const Icon = iconMap[option.icon] || User
              const isActive = option.id === currentDashboard
              const theme = dashboardThemes[option.id] || dashboardThemes.member

              return (
                <button
                  key={option.id}
                  onClick={() => handleSwitch(option)}
                  disabled={isActive || switching}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors',
                    isActive ? cn(theme.bg, theme.text) : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                    (isActive || switching) && 'cursor-default'
                  )}
                >
                  <Icon className={cn('w-4 h-4', theme.primary)} />
                  <span className="flex-1 text-left truncate">{option.title}</span>
                  {isActive && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Expanded view
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg transition-all',
          currentTheme.bg,
          currentTheme.hover,
          currentTheme.border,
          'border',
          switching && 'opacity-50 cursor-wait'
        )}
      >
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md',
          currentTheme.accent
        )}>
          <CurrentIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={cn('text-sm font-medium truncate', currentTheme.text)}>
            {currentOption?.title || 'Dashboard'}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {dashboardOptions.length} dashboard tersedia
          </p>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <ArrowLeftRight className="w-3 h-3" />
              Ganti Dashboard
            </p>
          </div>
          {dashboardOptions.map((option) => {
            const Icon = iconMap[option.icon] || User
            const isActive = option.id === currentDashboard
            const theme = dashboardThemes[option.id] || dashboardThemes.member

            return (
              <button
                key={option.id}
                onClick={() => handleSwitch(option)}
                disabled={isActive || switching}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors',
                  isActive ? cn(theme.bg, theme.text, 'font-medium') : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                  (isActive || switching) && 'cursor-default'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md',
                  isActive ? theme.accent : 'bg-gray-100 dark:bg-gray-700'
                )}>
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : theme.primary)} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate">{option.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {option.description.slice(0, 35)}...
                  </p>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
