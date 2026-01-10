'use client'

import { useEffect, useState } from 'react'

interface ResponsivePageWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * ResponsivePageWrapper
 * 
 * Wrapper component yang membuat konten halaman bergeser ke kiri
 * ketika sidebar di-collapse, memanfaatkan space yang tersedia.
 * 
 * Features:
 * - Auto-detect sidebar collapsed state dari localStorage
 * - Smooth transition 300ms
 * - Responsive: hanya berlaku di desktop (lg breakpoint)
 * - Mobile-friendly: tidak ada margin negatif di mobile
 * 
 * Usage:
 * ```tsx
 * <ResponsivePageWrapper>
 *   <YourPageContent />
 * </ResponsivePageWrapper>
 * ```
 */
export default function ResponsivePageWrapper({ 
  children, 
  className = '' 
}: ResponsivePageWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check sidebar state from localStorage
    const checkSidebarState = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      setSidebarCollapsed(collapsed)
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    // Initial check
    checkSidebarState()
    checkMobile()

    // Listen to changes
    window.addEventListener('resize', checkMobile)
    window.addEventListener('storage', checkSidebarState)

    // Custom event from sidebar toggle
    const handleSidebarToggle = () => checkSidebarState()
    window.addEventListener('sidebarToggle', handleSidebarToggle)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('storage', checkSidebarState)
      window.removeEventListener('sidebarToggle', handleSidebarToggle)
    }
  }, [])

  return (
    <div 
      className={`transition-all duration-300 ${
        isMobile ? '' : sidebarCollapsed ? 'lg:-ml-44' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
