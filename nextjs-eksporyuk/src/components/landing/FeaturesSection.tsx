'use client'

import { Users, BookOpen, TrendingUp, Award, MessageSquare, DollarSign, ShieldCheck, Briefcase, Globe } from 'lucide-react'

const features = [
  {
    icon: Briefcase,
    title: 'Belajar & Praktek',
    description: 'Dibimbing langkah demi langkah, mulai dari persiapan dokumen, mencari buyer, hingga pengiriman.',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50'
  },
  {
    icon: MessageSquare,
    title: 'Konsultasi Online & Offline',
    description: 'Dapatkan bimbingan langsung dari 5 praktisi ekspor berpengalaman kapanpun Anda butuh.',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50'
  },
  {
    icon: Users,
    title: 'Komunitas Solid',
    description: 'Bergabung dengan 7000+ calon eksportir lainnya untuk networking dan berbagi pengalaman.',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50'
  },
  {
    icon: ShieldCheck,
    title: 'Prosedur Benar & Teruji',
    description: 'Pelajari proses ekspor yang benar, berurutan, dan sesuai prosedur untuk hasil maksimal.',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50'
  },
  {
    icon: Award,
    title: 'Sertifikat Penyelesaian',
    description: 'Dapatkan sertifikat yang diakui setelah menyelesaikan setiap tahapan pembelajaran.',
    gradient: 'from-yellow-500 to-amber-500',
    bgGradient: 'from-yellow-50 to-amber-50'
  },
  {
    icon: Globe,
    title: 'Akses Materi Global',
    description: 'Materi selalu update mengikuti perkembangan terbaru di dunia ekspor internasional.',
    gradient: 'from-indigo-500 to-blue-500',
    bgGradient: 'from-indigo-50 to-blue-50'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Kenapa Memilih Komunitas Ekspor Yuk?
          </h2>
          <p className="text-xl text-gray-600">
            Semua yang Anda butuhkan untuk menjadi eksportir sukses dalam satu platform.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
