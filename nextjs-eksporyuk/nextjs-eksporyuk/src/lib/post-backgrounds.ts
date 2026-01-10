// Post Background Presets untuk Komunitas Ekspor Yuk
// Sesuai PRD - Kategori: Ekspor & Logistik, Bisnis & Keuangan, Edukasi & Motivasi

export interface PostBackground {
  id: string
  name: string
  category: 'export' | 'business' | 'motivation' | 'solid' | 'gradient'
  type: 'gradient' | 'solid' | 'pattern'
  style: React.CSSProperties
  textColor: string
  overlayOpacity?: number
}

export const POST_BACKGROUNDS: PostBackground[] = [
  // === GRADIENT - EKSPOR & LOGISTIK ===
  {
    id: 'export-ocean-1',
    name: 'Ocean Export',
    category: 'export',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 50%, #90E0EF 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'export-globe-1',
    name: 'Global Trade',
    category: 'export',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #1B4965 0%, #5FA8D3 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'export-container-1',
    name: 'Container Blue',
    category: 'export',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #023E8A 0%, #0096C7 50%, #48CAE4 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'export-sea-1',
    name: 'Sea Route',
    category: 'export',
    type: 'gradient',
    style: {
      background: 'linear-gradient(180deg, #0A1128 0%, #1B4965 50%, #5FA8D3 100%)',
    },
    textColor: '#ffffff',
  },

  // === GRADIENT - BISNIS & KEUANGAN ===
  {
    id: 'business-growth-1',
    name: 'Business Growth',
    category: 'business',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'business-gold-1',
    name: 'Golden Success',
    category: 'business',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #F7971E 0%, #FFD200 100%)',
    },
    textColor: '#1a1a1a',
  },
  {
    id: 'business-finance-1',
    name: 'Finance Pro',
    category: 'business',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'business-profit-1',
    name: 'Profit Up',
    category: 'business',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'business-premium-1',
    name: 'Premium Dark',
    category: 'business',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)',
    },
    textColor: '#ffffff',
  },

  // === GRADIENT - EDUKASI & MOTIVASI ===
  {
    id: 'motivation-sunrise-1',
    name: 'Sunrise Energy',
    category: 'motivation',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'motivation-purple-1',
    name: 'Dream Big',
    category: 'motivation',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'motivation-calm-1',
    name: 'Calm Focus',
    category: 'motivation',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
    },
    textColor: '#1a1a1a',
  },
  {
    id: 'motivation-inspire-1',
    name: 'Inspire',
    category: 'motivation',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #5433FF 0%, #20BDFF 50%, #A5FECB 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'motivation-passion-1',
    name: 'Passion Red',
    category: 'motivation',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #CB356B 0%, #BD3F32 100%)',
    },
    textColor: '#ffffff',
  },

  // === SOLID COLORS ===
  {
    id: 'solid-blue-1',
    name: 'Solid Blue',
    category: 'solid',
    type: 'solid',
    style: {
      background: '#0077B6',
    },
    textColor: '#ffffff',
  },
  {
    id: 'solid-green-1',
    name: 'Solid Green',
    category: 'solid',
    type: 'solid',
    style: {
      background: '#059669',
    },
    textColor: '#ffffff',
  },
  {
    id: 'solid-orange-1',
    name: 'Solid Orange',
    category: 'solid',
    type: 'solid',
    style: {
      background: '#EA580C',
    },
    textColor: '#ffffff',
  },
  {
    id: 'solid-purple-1',
    name: 'Solid Purple',
    category: 'solid',
    type: 'solid',
    style: {
      background: '#7C3AED',
    },
    textColor: '#ffffff',
  },
  {
    id: 'solid-dark-1',
    name: 'Solid Dark',
    category: 'solid',
    type: 'solid',
    style: {
      background: '#1F2937',
    },
    textColor: '#ffffff',
  },
  {
    id: 'solid-red-1',
    name: 'Solid Red',
    category: 'solid',
    type: 'solid',
    style: {
      background: '#DC2626',
    },
    textColor: '#ffffff',
  },

  // === SPECIAL GRADIENTS ===
  {
    id: 'gradient-rainbow-1',
    name: 'Rainbow',
    category: 'gradient',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #FF6B6B 0%, #FECA57 25%, #48DBFB 50%, #5F27CD 75%, #FF6B6B 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'gradient-sunset-1',
    name: 'Sunset',
    category: 'gradient',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
    },
    textColor: '#1a1a1a',
  },
  {
    id: 'gradient-night-1',
    name: 'Night Sky',
    category: 'gradient',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)',
    },
    textColor: '#ffffff',
  },
  {
    id: 'gradient-nature-1',
    name: 'Nature Fresh',
    category: 'gradient',
    type: 'gradient',
    style: {
      background: 'linear-gradient(135deg, #56AB2F 0%, #A8E063 100%)',
    },
    textColor: '#ffffff',
  },
]

// Helper function to get background by ID
export function getBackgroundById(id: string): PostBackground | undefined {
  return POST_BACKGROUNDS.find(bg => bg.id === id)
}

// Helper function to get backgrounds by category
export function getBackgroundsByCategory(category: PostBackground['category']): PostBackground[] {
  return POST_BACKGROUNDS.filter(bg => bg.category === category)
}

// Helper function to get a random background
export function getRandomBackground(): PostBackground {
  const index = Math.floor(Math.random() * POST_BACKGROUNDS.length)
  return POST_BACKGROUNDS[index]
}

// Background categories for UI
export const BACKGROUND_CATEGORIES = [
  { id: 'export', name: 'Ekspor & Logistik', icon: '🚢' },
  { id: 'business', name: 'Bisnis & Keuangan', icon: '📈' },
  { id: 'motivation', name: 'Motivasi', icon: '💡' },
  { id: 'solid', name: 'Warna Solid', icon: '🎨' },
  { id: 'gradient', name: 'Gradient', icon: '🌈' },
] as const
