'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Apakah saya perlu pengalaman untuk bergabung?',
    answer: 'Tidak sama sekali. Komunitas ini dirancang untuk pemula hingga mahir. Kami akan membimbing Anda dari nol, mulai dari persiapan dokumen, mencari buyer, hingga pengiriman barang.'
  },
  {
    question: 'Berapa lama saya bisa mengakses materi?',
    answer: 'Tergantung paket yang Anda pilih. Kami menyediakan paket bulanan hingga tahunan. Untuk paket tertentu, kami memberikan akses seumur hidup ke komunitas dan beberapa materi bonus.'
  },
  {
    question: 'Apakah ada bimbingan langsung?',
    answer: 'Tentu saja. Kami menyediakan sesi konsultasi dan mentoring online maupun offline dengan 5 praktisi ekspor berpengalaman. Anda bisa bertanya dan berdiskusi langsung.'
  },
  {
    question: 'Bagaimana jika saya kesulitan menemukan buyer?',
    answer: 'Ini adalah salah satu fokus utama kami. Kami akan mengajarkan strategi jitu untuk riset pasar, menemukan calon buyer potensial, negosiasi, hingga dealing. Anda tidak akan dibiarkan sendirian.'
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Menemukan jawaban yang Anda butuhkan.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex justify-between items-center w-full p-6 text-left font-semibold text-lg text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
