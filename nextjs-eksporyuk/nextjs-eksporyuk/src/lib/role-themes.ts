// Brand-first theme configuration - Ekspor Yuk Blue
// All roles use brand blue for consistency, with role-specific badge colors for identification

const BRAND_COLORS = {
  primary: '#0066CC',      // Ekspor Yuk Brand Blue
  secondary: '#0052CC',    // Darker blue for depth
  accent: '#3399FF',       // Light blue for highlights
  dark: '#003D7A',         // Deep blue for text
}

export const roleThemes = {
  ADMIN: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#1E88E5',  // Light blue badge for admin identification
    slug: 'admin',
    displayName: 'Dashboard Admin',
    description: 'Panel Administrator Sistem',
    icon: '⚙️',
  },
  MENTOR: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#7B1FA2',  // Purple badge for mentor identification
    slug: 'mentor',
    displayName: 'Dashboard Mentor',
    description: 'Panel Mentor & Instruktur',
    icon: '🎓',
  },
  AFFILIATE: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#00796B',  // Green badge for affiliate identification
    slug: 'affiliate',
    displayName: 'Dashboard Affiliate',
    description: 'Panel Marketing Affiliate',
    icon: '🔗',
  },
  MEMBER_PREMIUM: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#F57C00',  // Orange badge for premium member identification
    slug: 'member-premium',
    displayName: 'Member Premium',
    description: 'Dashboard Member Premium',
    icon: '⭐',
  },
  MEMBER_FREE: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#616161',  // Gray badge for free member identification
    slug: 'member',
    displayName: 'Dashboard Member',
    description: 'Panel Member Gratis',
    icon: '👤',
  },
  FOUNDER: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#D4AF37',  // Gold badge for founder
    slug: 'founder',
    displayName: 'Dashboard Founder',
    description: 'Panel Founder',
    icon: '👑',
  },
  CO_FOUNDER: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    badgeColor: '#C0C0C0',  // Silver badge for co-founder
    slug: 'co-founder',
    displayName: 'Dashboard Co-Founder',
    description: 'Panel Co-Founder',
    icon: '🏆',
  },
}

export type RoleType = keyof typeof roleThemes
export type ThemeConfig = typeof roleThemes[RoleType]

export function getRoleTheme(role: string): ThemeConfig {
  return roleThemes[role as RoleType] || roleThemes.MEMBER_FREE
}
