'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Akses Sekarang di Platform
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              Belajar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Ekspor</span> Mudah dan Praktis di Komunitas
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              Sudah mencetak 7000+ calon Eksportir baru sejak Tahun 2022. Kini giliran Anda untuk memulai perjalanan ekspor.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                  Gabung Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-50 shadow-sm">
                <Play className="mr-2 h-5 w-5" />
                Lihat Materi
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
                ))}
              </div>
              <div>
                <div className="font-semibold text-gray-900">7,000+ Calon Eksportir</div>
                <div className="text-sm text-gray-600">Telah bergabung</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-blue-500/20 p-6 border border-gray-100">
              {/* Dashboard Preview Mock */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
                    <div>
                      <div className="font-semibold text-gray-900">Dashboard Pembelajaran</div>
                      <div className="text-sm text-gray-500">Selamat datang kembali!</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-700">12</div>
                    <div className="text-sm text-blue-600">Kursus Aktif</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-purple-700">85%</div>
                    <div className="text-sm text-purple-600">Progress</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Ekspor 101</span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Selesai</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-sm font-medium">Marketing Digital</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Berjalan</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -right-4 -top-4 bg-white rounded-xl shadow-xl shadow-purple-500/20 p-4 border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-sm">🏆</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Achievement</div>
                  <div className="text-sm font-semibold">+250 Points</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -left-4 bottom-8 bg-white rounded-xl shadow-xl shadow-green-500/20 p-4 border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Completed</div>
                  <div className="text-sm font-semibold">3 Courses</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
