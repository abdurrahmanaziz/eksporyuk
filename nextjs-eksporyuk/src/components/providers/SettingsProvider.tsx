'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface WebsiteSettings {
  siteTitle: string
  siteDescription: string
  siteLogo: string | null
  siteFavicon: string | null
  primaryColor: string
  secondaryColor: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  buttonSuccessBg: string
  buttonSuccessText: string
  buttonDangerBg: string
  buttonDangerText: string
  buttonBorderRadius: string
  headerText: string | null
  footerText: string | null
  contactEmail: string | null
  contactPhone: string | null
  whatsappNumber: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
  customCss: string | null
  customJs: string | null
  maintenanceMode: boolean
  defaultLanguage: string
  bannerImage: string | null
}

const defaultSettings: WebsiteSettings = {
  siteTitle: 'Eksporyuk',
  siteDescription: 'Platform Ekspor Indonesia',
  siteLogo: null,
  siteFavicon: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#1F2937',
  buttonPrimaryBg: '#3B82F6',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#6B7280',
  buttonSecondaryText: '#FFFFFF',
  buttonSuccessBg: '#10B981',
  buttonSuccessText: '#FFFFFF',
  buttonDangerBg: '#EF4444',
  buttonDangerText: '#FFFFFF',
  buttonBorderRadius: '0.5rem',
  headerText: null,
  footerText: null,
  contactEmail: null,
  contactPhone: null,
  whatsappNumber: null,
  instagramUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
  customCss: null,
  customJs: null,
  maintenanceMode: false,
  defaultLanguage: 'id',
  bannerImage: null,
}

interface SettingsContextType {
  settings: WebsiteSettings
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
})

export const useSettings = () => useContext(SettingsContext)

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')
  
  // Parse the hex color
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            ...defaultSettings,
            ...data,
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Apply CSS variables for button colors
  useEffect(() => {
    if (!loading) {
      const root = document.documentElement
      
      // Set CSS custom properties for buttons
      if (settings.buttonPrimaryBg) {
        root.style.setProperty('--button-primary-bg', settings.buttonPrimaryBg)
        root.style.setProperty('--button-primary-bg-hsl', hexToHSL(settings.buttonPrimaryBg))
      }
      if (settings.buttonPrimaryText) {
        root.style.setProperty('--button-primary-text', settings.buttonPrimaryText)
        root.style.setProperty('--button-primary-text-hsl', hexToHSL(settings.buttonPrimaryText))
      }
      if (settings.buttonSecondaryBg) {
        root.style.setProperty('--button-secondary-bg', settings.buttonSecondaryBg)
        root.style.setProperty('--button-secondary-bg-hsl', hexToHSL(settings.buttonSecondaryBg))
      }
      if (settings.buttonSecondaryText) {
        root.style.setProperty('--button-secondary-text', settings.buttonSecondaryText)
        root.style.setProperty('--button-secondary-text-hsl', hexToHSL(settings.buttonSecondaryText))
      }
      if (settings.buttonSuccessBg) {
        root.style.setProperty('--button-success-bg', settings.buttonSuccessBg)
        root.style.setProperty('--button-success-bg-hsl', hexToHSL(settings.buttonSuccessBg))
      }
      if (settings.buttonSuccessText) {
        root.style.setProperty('--button-success-text', settings.buttonSuccessText)
        root.style.setProperty('--button-success-text-hsl', hexToHSL(settings.buttonSuccessText))
      }
      if (settings.buttonDangerBg) {
        root.style.setProperty('--button-danger-bg', settings.buttonDangerBg)
        root.style.setProperty('--button-danger-bg-hsl', hexToHSL(settings.buttonDangerBg))
      }
      if (settings.buttonDangerText) {
        root.style.setProperty('--button-danger-text', settings.buttonDangerText)
        root.style.setProperty('--button-danger-text-hsl', hexToHSL(settings.buttonDangerText))
      }
      if (settings.buttonBorderRadius) {
        root.style.setProperty('--button-border-radius', settings.buttonBorderRadius)
      }
      
      // Update primary color (affects default button)
      if (settings.primaryColor) {
        root.style.setProperty('--primary', hexToHSL(settings.primaryColor))
      }
      
      // Update primary foreground to match button primary text
      if (settings.buttonPrimaryText) {
        root.style.setProperty('--primary-foreground', hexToHSL(settings.buttonPrimaryText))
      }

      // Update document title if siteTitle is set
      if (settings.siteTitle) {
        document.title = settings.siteTitle
      }

      // Update favicon if siteFavicon is set
      if (settings.siteFavicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.getElementsByTagName('head')[0].appendChild(link)
        }
        link.href = settings.siteFavicon
      }

      // Inject custom CSS
      if (settings.customCss) {
        let styleElement = document.getElementById('custom-css')
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = 'custom-css'
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = settings.customCss
      }

      // Inject custom JS (be careful with this!)
      if (settings.customJs) {
        let scriptElement = document.getElementById('custom-js')
        if (!scriptElement) {
          scriptElement = document.createElement('script')
          scriptElement.id = 'custom-js'
          document.body.appendChild(scriptElement)
        }
        scriptElement.textContent = settings.customJs
      }
    }
  }, [settings, loading])

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}
