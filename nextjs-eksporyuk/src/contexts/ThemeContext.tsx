'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeColors {
  primary: string // Main brand color
  secondary: string
  accent: string
  background: string
}

interface ThemeContextType {
  colors: ThemeColors
  updateColors: (colors: Partial<ThemeColors>) => void
  resetColors: () => void
}

const defaultColors: ThemeColors = {
  primary: 'orange', // orange-600, orange-500, etc
  secondary: 'blue',
  accent: 'purple',
  background: 'gray', // gray-50, gray-100
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme-colors')
    if (saved) {
      try {
        setColors(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load theme colors:', e)
      }
    }
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('theme-colors', JSON.stringify(colors))
  }, [colors])

  const updateColors = (newColors: Partial<ThemeColors>) => {
    setColors(prev => ({ ...prev, ...newColors }))
  }

  const resetColors = () => {
    setColors(defaultColors)
    localStorage.removeItem('theme-colors')
  }

  return (
    <ThemeContext.Provider value={{ colors, updateColors, resetColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
