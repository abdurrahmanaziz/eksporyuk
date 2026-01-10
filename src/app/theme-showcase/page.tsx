'use client'

import { roleThemes, getRoleTheme } from '@/lib/role-themes'

export default function ThemeShowcase() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Role Theme Showcase</h1>
        <p className="text-gray-600 mb-8">View all role-based themes with their colors and styling</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(roleThemes).map(([role, themeData]) => {
            const theme = getRoleTheme(role)
            return (
              <div key={role} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Hero Section */}
                <div 
                  className="p-6 text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  <div className="text-4xl mb-2">{theme.icon}</div>
                  <h2 className="text-2xl font-bold">{role}</h2>
                  <p className="text-white/80 text-sm mt-1">{theme.displayName}</p>
                </div>

                {/* Color Display */}
                <div className="p-6">
                  {/* Primary */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="text-sm font-mono font-medium">{theme.primary}</span>
                    </div>
                    <p className="text-xs text-gray-500">Primary Color</p>
                  </div>

                  {/* Secondary */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: theme.secondary }}
                      />
                      <span className="text-sm font-mono font-medium">{theme.secondary}</span>
                    </div>
                    <p className="text-xs text-gray-500">Secondary Color</p>
                  </div>

                  {/* Accent */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <span className="text-sm font-mono font-medium">{theme.accent}</span>
                    </div>
                    <p className="text-xs text-gray-500">Accent Color</p>
                  </div>

                  {/* Button Preview */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button 
                      className="w-full py-2 px-3 rounded text-white font-medium text-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {theme.displayName}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Usage Example */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Usage Example</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { getRoleTheme } from '@/lib/role-themes'

export default function MyComponent() {
  const userRole = session?.user?.role || 'MEMBER_FREE'
  const theme = getRoleTheme(userRole)

  return (
    <div style={{ color: theme.primary }}>
      {theme.icon} {theme.displayName}
    </div>
  )
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
