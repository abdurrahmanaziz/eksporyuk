'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, DollarSign, GraduationCap, Shield, 
  ChevronDown, ArrowRightLeft, Check, Loader2
} from 'lucide-react'

interface DashboardOption {
  id: string
  title: string
  description: string
  href: string
  icon: string
  gradient: string
}

const iconMap: Record<string, React.ComponentType<any>> = {
  User,
  DollarSign,
  GraduationCap,
  Shield,
}

const gradientMap: Record<string, string> = {
  member: 'from-blue-600 to-cyan-500',
  affiliate: 'from-emerald-600 to-teal-500',
  mentor: 'from-purple-600 to-indigo-500',
  admin: 'from-red-600 to-orange-500',
}

interface DashboardSwitcherProps {
  currentDashboard: 'member' | 'affiliate' | 'mentor' | 'admin'
  variant?: 'minimal' | 'full'
  className?: string
}

export default function DashboardSwitcher({ 
  currentDashboard, 
  variant = 'full',
  className = '' 
}: DashboardSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<DashboardOption[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch available dashboards
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/user/dashboard-options')
        const data = await response.json()
        
        if (data.success && data.dashboardOptions) {
          const opts = data.dashboardOptions.map((opt: any) => ({
            ...opt,
            gradient: gradientMap[opt.id] || gradientMap.member,
          }))
          setOptions(opts)
        }
      } catch (error) {
        console.error('Error fetching dashboard options:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [])

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

  // Don't show switcher if only one option or still loading
  if (loading || options.length <= 1) {
    return null
  }

  const currentOption = options.find(o => o.id === currentDashboard)
  const otherOptions = options.filter(o => o.id !== currentDashboard)
  const CurrentIcon = currentOption ? iconMap[currentOption.icon] || User : User

  const handleSwitch = async (option: DashboardOption) => {
    setSwitching(option.id)
    
    try {
      // Save preference
      await fetch('/api/user/set-preferred-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardType: option.id })
      })
    } catch (error) {
      console.error('Error saving preference:', error)
    }
    
    // Navigate to selected dashboard
    router.push(option.href)
  }

  // Minimal variant - just an icon button
  if (variant === 'minimal') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
          title="Pindah Dashboard"
        >
          <ArrowRightLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pindah Dashboard</p>
            </div>
            
            {otherOptions.map((option) => {
              const Icon = iconMap[option.icon] || User
              const isSwitching = switching === option.id
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSwitch(option)}
                  disabled={switching !== null}
                  className="w-full px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center`}>
                    {isSwitching ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">{option.title}</p>
                    <p className="text-xs text-gray-500 truncate">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Full variant - shows current dashboard with dropdown
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl 
          bg-gradient-to-r ${currentOption?.gradient || gradientMap.member} 
          text-white shadow-md hover:shadow-lg transition-all
        `}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:block">{currentOption?.title || 'Dashboard'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Current Dashboard */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Dashboard Aktif</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentOption?.gradient} flex items-center justify-center`}>
                <CurrentIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{currentOption?.title}</p>
                <p className="text-xs text-gray-500">{currentOption?.description}</p>
              </div>
              <Check className="w-5 h-5 text-green-500 ml-auto" />
            </div>
          </div>
          
          {/* Other Dashboards */}
          {otherOptions.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Pindah ke</p>
              
              {otherOptions.map((option) => {
                const Icon = iconMap[option.icon] || User
                const isSwitching = switching === option.id
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSwitch(option)}
                    disabled={switching !== null}
                    className="w-full p-3 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition-all disabled:opacity-50 group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                      {isSwitching ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{option.title}</p>
                      <p className="text-xs text-gray-500 truncate">{option.description}</p>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
