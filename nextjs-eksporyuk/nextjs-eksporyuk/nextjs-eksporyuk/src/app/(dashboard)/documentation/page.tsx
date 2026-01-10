'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Eye, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Documentation {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string
  icon: string | null
  viewCount: number
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

export default function DocumentationHomePage() {
  const { data: session } = useSession()
  const [docs, setDocs] = useState<Documentation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocumentation()
  }, [])

  const fetchDocumentation = async () => {
    try {
      const response = await fetch('/api/documentation')
      if (response.ok) {
        const data = await response.json()
        setDocs(data.docs || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get featured docs (first 3)
  const featuredDocs = docs.slice(0, 3)
  
  // Get popular docs (sorted by view count)
  const popularDocs = [...docs].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4)

  // Group by category for quick access
  const categories = docs.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = 0
    }
    acc[doc.category]++
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Dokumentasi Platform
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          Pusat Bantuan EksporYuk
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
          Temukan panduan lengkap untuk memaksimalkan penggunaan platform EksporYuk.
          Pilih topik dari sidebar atau mulai dari panduan di bawah.
        </p>
      </div>

      {/* Quick Start Cards */}
      <div className="mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🚀</span>
          Mulai Cepat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {featuredDocs.map((doc, index) => (
            <Link key={doc.id} href={`/documentation/${doc.slug}`}>
              <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg sm:text-xl shrink-0">
                      {doc.icon || (index + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.excerpt || 'Baca selengkapnya...'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Baca <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">📚</span>
          Kategori
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {Object.entries(categories).map(([category, count]) => (
            <Card 
              key={category} 
              className="hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer"
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <Badge variant="secondary" className="mb-1.5 sm:mb-2 text-xs">
                  {count} artikel
                </Badge>
                <p className="text-xs sm:text-sm font-medium">
                  {CATEGORY_LABELS[category] || category}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Popular Docs */}
      {popularDocs.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🔥</span>
            Populer
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {popularDocs.map((doc) => (
                <Link 
                  key={doc.id} 
                  href={`/documentation/${doc.slug}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-muted flex items-center justify-center text-base sm:text-lg shrink-0">
                    {doc.icon || <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    {doc.viewCount}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Footer */}
      <div className="mt-8 sm:mt-12 text-center py-6 sm:py-8 border-t">
        <p className="text-muted-foreground text-xs sm:text-sm">
          Tidak menemukan yang Anda cari?{' '}
          <a href="/chat" className="text-primary hover:underline">
            Hubungi Tim Support
          </a>
        </p>
      </div>
    </div>
  )
}
