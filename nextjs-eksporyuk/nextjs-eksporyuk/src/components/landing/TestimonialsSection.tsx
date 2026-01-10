'use client'

import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Eksportir Furniture',
    avatar: '👨‍💼',
    rating: 5,
    content: 'Platform ini benar-benar membantu saya memahami cara ekspor yang benar. Materinya lengkap dan mentornya sangat responsif!'
  },
  {
    name: 'Siti Rahmawati',
    role: 'Affiliate Marketer',
    avatar: '👩‍💼',
    rating: 5,
    content: 'Saya sudah menghasilkan komisi lebih dari 5 juta dalam 2 bulan. Program affiliatenya sangat mudah diikuti!'
  },
  {
    name: 'Ahmad Fauzi',
    role: 'Pengusaha UMKM',
    avatar: '🧑‍💻',
    rating: 5,
    content: 'Komunitasnya sangat supportive. Banyak insight berharga yang saya dapatkan dari member lain dan mentor.'
  }
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Apa Kata Mereka?
          </h2>
          <p className="text-xl text-gray-600">
            Kisah sukses dari para member yang telah bergabung dengan Komunitas Ekspor Yuk.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300 hover:-translate-y-2 border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
