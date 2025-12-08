'use client'

import { useState, useEffect } from 'react'

interface CheckoutColors {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
}

const defaultColors: CheckoutColors = {
  primary: '#3b82f6', // blue-500
  secondary: '#1e40af', // blue-700
  accent: '#60a5fa', // blue-400
  success: '#22c55e', // green-500
  warning: '#eab308', // yellow-500
}

export function useCheckoutColors() {
  const [colors, setColors] = useState<CheckoutColors>(defaultColors)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchColors() {
      try {
        const response = await fetch('/api/settings/checkout-colors')
        if (response.ok) {
          const data = await response.json()
          setColors(data.colors)
        }
      } catch (error) {
        console.error('Error fetching checkout colors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchColors()
  }, [])

  // Helper functions untuk generate variations
  const getColorWithOpacity = (color: string, opacity: number) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  const lighten = (color: string, amount: number = 0.9) => {
    return getColorWithOpacity(color, amount)
  }

  const darken = (color: string) => {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 30)
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 30)
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 30)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return {
    colors,
    loading,
    // Computed colors for easier use
    computed: {
      primary: colors.primary,
      primaryHover: darken(colors.primary),
      primaryLight: lighten(colors.primary, 0.1),
      primaryBg: lighten(colors.primary, 0.05),
      secondary: colors.secondary,
      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,
    },
    // Utility functions
    getColorWithOpacity,
    lighten,
    darken,
  }
}
