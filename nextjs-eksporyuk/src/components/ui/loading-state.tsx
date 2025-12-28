'use client'

import { Loader2, Circle, RotateCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type LoadingType = 'spinner' | 'dots' | 'skeleton' | 'pulse'

export interface LoadingStateProps {
  type?: LoadingType
  title?: string
  message?: string
  progress?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showCard?: boolean
}

const sizeConfig = {
  sm: { spinner: 'h-4 w-4', text: 'text-sm' },
  md: { spinner: 'h-6 w-6', text: 'text-base' },
  lg: { spinner: 'h-8 w-8', text: 'text-lg' },
  xl: { spinner: 'h-12 w-12', text: 'text-xl' }
}

function SpinnerLoader({ size, className }: { size: keyof typeof sizeConfig; className?: string }) {
  return (
    <Loader2 className={cn(sizeConfig[size].spinner, 'animate-spin text-primary', className)} />
  )
}

function DotsLoader({ size }: { size: keyof typeof sizeConfig }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <Circle
          key={i}
          className={cn(
            sizeConfig[size].spinner,
            'animate-pulse fill-primary text-primary'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  )
}

function PulseLoader({ size }: { size: keyof typeof sizeConfig }) {
  return (
    <RotateCw className={cn(sizeConfig[size].spinner, 'animate-spin text-primary')} />
  )
}

export function LoadingState({
  type = 'spinner',
  title,
  message,
  progress,
  size = 'md',
  className = '',
  showCard = false
}: LoadingStateProps) {
  const LoaderComponent = () => {
    switch (type) {
      case 'dots':
        return <DotsLoader size={size} />
      case 'skeleton':
        return <SkeletonLoader className="w-full" />
      case 'pulse':
        return <PulseLoader size={size} />
      default:
        return <SpinnerLoader size={size} />
    }
  }

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-4 p-4', className)}>
      <LoaderComponent />
      
      {title && (
        <h3 className={cn('font-medium text-center', sizeConfig[size].text)}>
          {title}
        </h3>
      )}
      
      {message && (
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {message}
        </p>
      )}

      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )

  if (showCard) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            {content}
          </CardContent>
        </Card>
      </div>
    )
  }

  return content
}

// Full Page Loading
export function FullPageLoading({
  title = "Memuat...",
  message = "Harap tunggu sebentar",
  size = 'lg'
}: Omit<LoadingStateProps, 'className'>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingState
        title={title}
        message={message}
        size={size}
        showCard
      />
    </div>
  )
}

// Inline Loading (for buttons, forms, etc.)
export function InlineLoading({
  text = "Loading...",
  size = 'sm',
  className
}: {
  text?: string
  size?: keyof typeof sizeConfig
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SpinnerLoader size={size} />
      <span className={sizeConfig[size].text}>{text}</span>
    </div>
  )
}

// Section Loading
export function SectionLoading({
  title,
  message = "Memuat data...",
  className,
  minHeight = 'min-h-[200px]'
}: {
  title?: string
  message?: string
  className?: string
  minHeight?: string
}) {
  return (
    <div className={cn('flex items-center justify-center', minHeight, className)}>
      <LoadingState
        title={title}
        message={message}
        size="md"
      />
    </div>
  )
}

// Form Loading Overlay
export function FormLoadingOverlay({
  isVisible,
  message = "Menyimpan...",
  children
}: {
  isVisible: boolean
  message?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {children}
      {isVisible && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <LoadingState
            title={message}
            size="md"
            showCard
          />
        </div>
      )}
    </div>
  )
}