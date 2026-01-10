'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  Search, 
  BookOpen, 
  ChevronRight,
  ChevronDown,
  FileText,
  Loader2,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Documentation {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string
  icon: string | null
  order: number
  parentId: string | null
  children?: Documentation[]
}

interface GroupedDocs {
  [category: string]: Documentation[]
}

const CATEGORY_LABELS: Record<string, string> = {
  GETTING_STARTED: 'Memulai',
  ROLES: 'Peran & Akses',
  FEATURES: 'Fitur Platform',
  API: 'Dokumentasi API',
  ADMIN: 'Panel Admin',
  DATABASE: 'Database',
  GUIDES: 'Panduan',
  FAQ: 'FAQ',
  TROUBLESHOOTING: 'Troubleshooting',
  GLOSSARY: 'Glosarium',
}

const CATEGORY_ORDER = [
  'GETTING_STARTED',
  'GUIDES',
  'FEATURES',
  'ROLES',
  'API',
  'ADMIN',
  'DATABASE',
  'FAQ',
  'TROUBLESHOOTING',
  'GLOSSARY',
]

// Context for sharing docs data
const DocsContext = createContext<{
  docs: Documentation[]
  groupedDocs: GroupedDocs
  loading: boolean
  currentSlug: string | null
}>({
  docs: [],
  groupedDocs: {},
  loading: true,
  currentSlug: null
})

export const useDocsContext = () => useContext(DocsContext)

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [docs, setDocs] = useState<Documentation[]>([])
  const [groupedDocs, setGroupedDocs] = useState<GroupedDocs>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['GETTING_STARTED', 'GUIDES']))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get current slug from pathname
  const currentSlug = pathname?.includes('/documentation/') 
    ? pathname.split('/documentation/')[1] 
    : null

  useEffect(() => {
    fetchDocumentation()
  }, [])

  useEffect(() => {
    // Group docs by category with sorting
    const grouped = docs.reduce((acc, doc) => {
      const category = doc.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(doc)
      return acc
    }, {} as GroupedDocs)

    // Sort docs within each category by order
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.order - b.order)
    })

    setGroupedDocs(grouped)

    // Auto-expand category of current doc
    if (currentSlug) {
      const currentDoc = docs.find(d => d.slug === currentSlug)
      if (currentDoc) {
        setExpandedCategories(prev => new Set([...prev, currentDoc.category]))
      }
    }
  }, [docs, currentSlug])

  const fetchDocumentation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documentation')
      
      if (!response.ok) {
        throw new Error('Failed to fetch documentation')
      }

      const data = await response.json()
      setDocs(data.docs || [])
    } catch (error) {
      console.error('Error fetching documentation:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Filter docs based on search
  const filteredGrouped = Object.entries(groupedDocs).reduce((acc, [category, categoryDocs]) => {
    if (!searchQuery) {
      acc[category] = categoryDocs
      return acc
    }
    
    const filtered = categoryDocs.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.excerpt && doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    
    if (filtered.length > 0) {
      acc[category] = filtered
    }
    return acc
  }, {} as GroupedDocs)

  // Sort categories by predefined order
  const sortedCategories = Object.keys(filteredGrouped).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a)
    const indexB = CATEGORY_ORDER.indexOf(b)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  // Sidebar content component for reuse
  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      {/* Logo/Header */}
      <div className="p-4 border-b">
        <Link href="/documentation" className="flex items-center gap-2 font-semibold text-lg" onClick={onLinkClick}>
          <BookOpen className="w-5 h-5 text-primary" />
          <span>Dokumentasi</span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <nav className="px-2 space-y-1">
            {sortedCategories.map(category => {
              const categoryDocs = filteredGrouped[category]
              const isExpanded = expandedCategories.has(category) || searchQuery !== ''
              
              return (
                <div key={category} className="mb-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="uppercase text-xs tracking-wider">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground/60">
                      {categoryDocs.length}
                    </span>
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {categoryDocs.map(doc => {
                        const isActive = currentSlug === doc.slug
                        return (
                          <Link
                            key={doc.id}
                            href={`/documentation/${doc.slug}`}
                            onClick={onLinkClick}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                              isActive 
                                ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            {doc.icon ? (
                              <span className="text-base">{doc.icon}</span>
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="truncate">{doc.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Empty state */}
            {sortedCategories.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery 
                  ? 'Tidak ada hasil ditemukan'
                  : 'Belum ada dokumentasi'}
              </div>
            )}
          </nav>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>EksporYuk Docs v1.0</span>
        </div>
      </div>
    </>
  )

  return (
    <DocsContext.Provider value={{ docs, groupedDocs, loading, currentSlug }}>
      <ResponsivePageWrapper className="min-h-[calc(100vh-64px)]">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-background">
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-40">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link href="/documentation" className="flex items-center gap-2 font-semibold">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Dokumentasi</span>
            </Link>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-72 border-r bg-muted/30 flex-col shrink-0 sticky top-0 h-[calc(100vh-64px)]">
            <SidebarContent />
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </ResponsivePageWrapper>
    </DocsContext.Provider>
  )
}
