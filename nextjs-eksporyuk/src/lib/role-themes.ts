// Role-based theme configuration
export const roleThemes = {
  ADMIN: {
    primary: '#1E88E5',
    secondary: '#42A5F5',
    accent: '#64B5F6',
    slug: 'admin',
    displayName: 'Dashboard Admin',
    description: 'Panel Administrator Sistem',
    icon: '⚙️',
  },
  MENTOR: {
    primary: '#7B1FA2',
    secondary: '#9C27B0',
    accent: '#BA68C8',
    slug: 'mentor',
    displayName: 'Dashboard Mentor',
    description: 'Panel Mentor & Instruktur',
    icon: '🎓',
  },
  AFFILIATE: {
    primary: '#00796B',
    secondary: '#009688',
    accent: '#26A69A',
    slug: 'affiliate',
    displayName: 'Dashboard Affiliate',
    description: 'Panel Marketing Affiliate',
    icon: '🔗',
  },
  MEMBER_PREMIUM: {
    primary: '#F57C00',
    secondary: '#FB8C00',
    accent: '#FFB74D',
    slug: 'member-premium',
    displayName: 'Member Premium',
    description: 'Dashboard Member Premium',
    icon: '⭐',
  },
  MEMBER_FREE: {
    primary: '#424242',
    secondary: '#616161',
    accent: '#9E9E9E',
    slug: 'member',
    displayName: 'Dashboard Member',
    description: 'Panel Member Gratis',
    icon: '👤',
  },
}

export type RoleType = keyof typeof roleThemes
export type ThemeConfig = typeof roleThemes[RoleType]

export function getRoleTheme(role: string): ThemeConfig {
  return roleThemes[role as RoleType] || roleThemes.MEMBER_FREE
}
