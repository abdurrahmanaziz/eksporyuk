'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Siap Memulai Perjalanan Anda?
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Bergabunglah dengan Ribuan Member yang Sudah Sukses
          </h2>
          
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Dapatkan akses penuh ke semua fitur, komunitas eksklusif, dan peluang penghasilan unlimited. Mulai gratis hari ini!
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl shadow-black/20 hover:shadow-3xl hover:scale-105 transition-all">
                Daftar Sekarang - Gratis!
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-white/90">
            <div>
              <div className="text-3xl font-bold">5,000+</div>
              <div className="text-sm">Member Aktif</div>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div>
              <div className="text-3xl font-bold">200+</div>
              <div className="text-sm">Kursus Premium</div>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div>
              <div className="text-3xl font-bold">4.9/5</div>
              <div className="text-sm">Rating Pengguna</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
