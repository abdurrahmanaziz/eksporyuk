'use client'

import dynamic from 'next/dynamic'

// Lazy load OneSignal - no SSR, load after page interactive
const OneSignalComponent = dynamic(
  () => import('./OneSignalComponent'),
  { 
    ssr: false,
    loading: () => null
  }
)

export default function OneSignalProvider() {
  return <OneSignalComponent />
}
