'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Loader2, 
  Eye, 
  Calendar, 
  User, 
  Clock,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Documentation {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  category: string
  status: string
  viewCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  icon: string | null
  author: {
    name: string | null
    avatar: string | null
  }
  children?: Documentation[]
}

interface NavDoc {
  id: string
  slug: string
  title: string
  icon: string | null
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

export default function DocumentationDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [doc, setDoc] = useState<Documentation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allDocs, setAllDocs] = useState<NavDoc[]>([])
  const [tableOfContents, setTableOfContents] = useState<{id: string, text: string, level: number}[]>([])

  const slug = params?.slug as string

  useEffect(() => {
    if (slug) {
      fetchDocumentation()
      fetchAllDocs()
    }
  }, [slug])

  // Extract table of contents from markdown
  useEffect(() => {
    if (doc?.content) {
      const headings: {id: string, text: string, level: number}[] = []
      const regex = /^(#{1,3})\s+(.+)$/gm
      let match
      
      while ((match = regex.exec(doc.content)) !== null) {
        const level = match[1].length
        const text = match[2].replace(/[*_`]/g, '') // Remove markdown formatting
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        headings.push({ id, text, level })
      }
      
      setTableOfContents(headings)
    }
  }, [doc?.content])

  const fetchDocumentation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/documentation?slug=${slug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Dokumentasi tidak ditemukan')
        } else if (response.status === 403) {
          setError('Anda tidak memiliki akses ke dokumentasi ini')
        } else {
          throw new Error('Failed to fetch documentation')
        }
        return
      }

      const data = await response.json()
      setDoc(data.doc || null)
    } catch (error) {
      console.error('Error fetching documentation:', error)
      setError('Terjadi kesalahan saat memuat dokumentasi')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllDocs = async () => {
    try {
      const response = await fetch('/api/documentation')
      if (response.ok) {
        const data = await response.json()
        setAllDocs(data.docs || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Get prev/next docs for navigation
  const currentIndex = allDocs.findIndex(d => d.slug === slug)
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-xl font-semibold mb-2">{error}</h2>
        <p className="text-muted-foreground mb-4">
          Halaman yang Anda cari tidak tersedia.
        </p>
        <Link href="/documentation">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali ke Dokumentasi
          </Button>
        </Link>
      </div>
    )
  }

  if (!doc) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-col xl:flex-row min-h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <article className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 overflow-x-auto">
            <Link href="/documentation" className="hover:text-foreground whitespace-nowrap">
              Dokumentasi
            </Link>
            <span>/</span>
            <span className="truncate">{CATEGORY_LABELS[doc.category] || doc.category}</span>
          </div>

          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start sm:items-center gap-3 mb-4">
              {doc.icon && (
                <span className="text-3xl sm:text-4xl">{doc.icon}</span>
              )}
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-2 text-xs">
                  {CATEGORY_LABELS[doc.category] || doc.category}
                </Badge>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{doc.title}</h1>
              </div>
            </div>
            
            {doc.excerpt && (
              <p className="text-base sm:text-lg text-muted-foreground">
                {doc.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
              {doc.author?.name && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{doc.author.name}</span>
                </div>
              )}
              {doc.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{formatDate(doc.publishedAt)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{doc.viewCount} views</span>
              </div>
              {doc.updatedAt !== doc.createdAt && (
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <Clock className="w-4 h-4" />
                  <span>Diperbarui {formatDate(doc.updatedAt)}</span>
                </div>
              )}
            </div>
          </header>

          <Separator className="mb-6 sm:mb-8" />

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h1:text-xl prose-h1:sm:text-2xl prose-h2:text-lg prose-h2:sm:text-xl prose-h3:text-base prose-h3:sm:text-lg prose-p:text-sm prose-p:sm:text-base prose-p:leading-relaxed prose-li:text-sm prose-li:sm:text-base prose-li:leading-relaxed prose-table:text-xs prose-table:sm:text-sm prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-th:border">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return <h1 id={id} className="text-2xl font-bold mt-8 mb-4">{children}</h1>
                },
                h2: ({children}) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return <h2 id={id} className="text-xl font-semibold mt-6 mb-3 pb-2 border-b">{children}</h2>
                },
                h3: ({children}) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return <h3 id={id} className="text-lg font-semibold mt-4 mb-2">{children}</h3>
                },
                p: ({children}) => <p className="mb-4 leading-7">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({children}) => <li className="leading-7">{children}</li>,
                table: ({children}) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full border-collapse border rounded-lg overflow-hidden">{children}</table>
                  </div>
                ),
                th: ({children}) => <th className="bg-muted p-3 text-left font-semibold border">{children}</th>,
                td: ({children}) => <td className="p-3 border">{children}</td>,
                code: ({children, className}) => {
                  const isInline = !className
                  if (isInline) {
                    return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>
                  }
                  return (
                    <code className="block text-sm text-slate-200">
                      {children}
                    </code>
                  )
                },
                pre: ({children}) => (
                  <pre className="bg-slate-800 dark:bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 border border-slate-700">
                    {children}
                  </pre>
                ),
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                a: ({href, children}) => (
                  <a href={href} className="text-primary hover:underline" target={href?.startsWith('http') ? '_blank' : undefined}>
                    {children}
                  </a>
                ),
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </div>

          <Separator className="my-8" />

          {/* Feedback Section */}
          <div className="bg-muted/50 rounded-lg p-6 text-center mb-8">
            <p className="text-sm font-medium mb-3">Apakah artikel ini membantu?</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <ThumbsUp className="w-4 h-4" />
                Ya
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ThumbsDown className="w-4 h-4" />
                Tidak
              </Button>
            </div>
          </div>

          {/* Prev/Next Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {prevDoc ? (
              <Link 
                href={`/documentation/${prevDoc.slug}`}
                className="flex items-center gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs text-muted-foreground">Sebelumnya</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{prevDoc.title}</p>
                </div>
              </Link>
            ) : <div className="hidden sm:block" />}
            
            {nextDoc && (
              <Link 
                href={`/documentation/${nextDoc.slug}`}
                className="flex items-center justify-end gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors group text-right"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Selanjutnya</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{nextDoc.title}</p>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            )}
          </div>
        </article>
      </div>

      {/* Right Sidebar - Table of Contents (hidden on mobile/tablet) */}
      {tableOfContents.length > 2 && (
        <aside className="hidden xl:block w-56 border-l bg-muted/20 shrink-0">
          <div className="sticky top-0 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Daftar Isi
            </p>
            <ScrollArea className="h-[calc(100vh-150px)]">
              <nav className="space-y-1">
                {tableOfContents.map((heading, index) => (
                  <a
                    key={index}
                    href={`#${heading.id}`}
                    className={`block text-xs py-1 hover:text-primary transition-colors ${
                      heading.level === 1 
                        ? 'font-medium' 
                        : heading.level === 2 
                          ? 'pl-3 text-muted-foreground' 
                          : 'pl-6 text-muted-foreground/80'
                    }`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>
      )}
    </div>
  )
}
