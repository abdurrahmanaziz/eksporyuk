'use client'

import { MapPin, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

interface MemberLocationBadgeProps {
  city?: string | null
  province?: string | null
  locationVerified?: boolean
  showIcon?: boolean
  showLink?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function MemberLocationBadge({
  city,
  province,
  locationVerified = false,
  showIcon = true,
  showLink = true,
  className = '',
  size = 'sm'
}: MemberLocationBadgeProps) {
  if (!city && !province) return null

  const locationText = city && province 
    ? `${city}, ${province}` 
    : city || province || ''

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const Content = () => (
    <span className={`inline-flex items-center gap-1 text-muted-foreground ${className}`}>
      {showIcon && <MapPin className={iconSizes[size]} />}
      <span className="truncate max-w-[150px]">{locationText}</span>
      {locationVerified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle2 className={`${iconSizes[size]} text-green-500`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Lokasi terverifikasi</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  )

  if (showLink) {
    return (
      <Link 
        href={`/member-directory?province=${encodeURIComponent(province || '')}&city=${encodeURIComponent(city || '')}`}
        className="hover:text-primary transition-colors"
      >
        <Content />
      </Link>
    )
  }

  return <Content />
}

// Badge variant for more prominent display
export function MemberLocationTag({
  city,
  province,
  locationVerified = false,
  className = ''
}: MemberLocationBadgeProps) {
  if (!city && !province) return null

  const locationText = city && province 
    ? `${city}, ${province}` 
    : city || province || ''

  return (
    <Link 
      href={`/member-directory?province=${encodeURIComponent(province || '')}&city=${encodeURIComponent(city || '')}`}
    >
      <Badge 
        variant="secondary" 
        className={`cursor-pointer hover:bg-secondary/80 ${className}`}
      >
        <MapPin className="h-3 w-3 mr-1" />
        {locationText}
        {locationVerified && (
          <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />
        )}
      </Badge>
    </Link>
  )
}
