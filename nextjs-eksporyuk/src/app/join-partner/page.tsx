'use client'

import { motion } from 'framer-motion'
import { ArrowRight, DollarSign, TrendingUp, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PublicHeader } from '@/components/layout/public/PublicHeader'
import { PublicFooter } from '@/components/layout/public/PublicFooter'
import { useEffect, useState } from 'react'

const RichAffiliateLandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  }

  const benefits = [
    {
      icon: <DollarSign className="w-10 h-10 text-green-400" />,
      title: 'Komisi Fantastis',
      description: 'Dapatkan komisi mulai dari Rp 200.000 hingga Rp 325.000 untuk setiap penjualan yang Anda hasilkan.',
    },
    {
      icon: <Zap className="w-10 h-10 text-yellow-400" />,
      title: 'Withdrawal Kapanpun',
      description: 'Tarik komisi Anda kapanpun dan dimanapun tanpa minimum penarikan yang rumit. Proses cepat dan mudah.',
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-blue-400" />,
      title: 'Peluang Tak Terbatas',
      description: 'Masuk ke industri ekspor yang sedang booming dan raih potensi penghasilan tanpa batas bersama kami.',
    },
    {
      icon: <Users className="w-10 h-10 text-purple-400" />,
      title: 'Bimbingan Mentor Ahli',
      description: 'Anda tidak sendirian. Dapatkan bimbingan eksklusif dari para mentor berpengalaman di dunia ekspor.',
    },
  ]

  const faqs = [
    {
      question: 'Apa itu Rich Affiliate?',
      answer: 'Rich Affiliate adalah program partner resmi dari Eksporyuk, dirancang untuk memberikan Anda penghasilan maksimal dengan mempromosikan produk-produk edukasi ekspor berkualitas tinggi.',
    },
    {
      question: 'Siapa saja yang bisa bergabung?',
      answer: 'Siapapun yang memiliki semangat untuk belajar dan berbagi. Baik Anda seorang content creator, influencer, atau member setia Eksporyuk, Anda bisa bergabung.',
    },
    {
      question: 'Bagaimana cara kerjanya?',
      answer: 'Daftar, dapatkan link unik Anda, sebarkan link tersebut, dan dapatkan komisi setiap kali ada yang melakukan pembelian melalui link Anda. Semudah itu!',
    },
    {
      question: 'Kapan saya bisa menarik komisi saya?',
      answer: 'Anda bisa melakukan penarikan dana (withdrawal) kapan saja setelah komisi masuk ke saldo Anda, sesuai dengan syarat dan ketentuan yang berlaku.',
    },
  ]

  const [brandColor, setBrandColor] = useState('#2563eb'); // Default blue

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          if(data.brandColor) {
            setBrandColor(data.brandColor);
          }
        }
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
      }
    }
    fetchSettings();
  }, []);


  return (
    <div className="bg-gray-900 text-white min-h-screen overflow-x-hidden flex flex-col">
      <PublicHeader />

      {/* Floating Money Animation - more subtle */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blue-500/50 text-lg"
            initial={{ y: '110vh', x: `${Math.random() * 100}vw`, opacity: 0 }}
            animate={{ y: '-10vh', opacity: [0, 0.5, 0.5, 0] }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              delay: Math.random() * 7,
            }}
          >
            $
          </motion.div>
        ))}
      </div>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <motion.section
          className="text-center py-20 md:py-32 px-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block rounded-full px-4 py-1 mb-4 text-sm"
            style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
            variants={itemVariants}
          >
            Program Partner Resmi Ekspor Yuk
          </motion.div>
          <h1 
            className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, #38bdf8)` }}
          >
            Selamat Datang di Rich Affiliate
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
            Ubah traffic Anda menjadi pundi-pundi rupiah. Bergabunglah dengan program affiliate paling menguntungkan di industri ekspor dan mulailah membangun kerajaan finansial Anda.
          </p>
          <motion.div variants={itemVariants} className="relative z-10">
            <Link href="/auth/register?role=AFFILIATE" passHref>
              <Button
                size="lg"
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 4px 30px ${brandColor}40`,
                }}
                className="w-full md:w-auto text-white font-bold text-base md:text-lg px-6 py-5 md:px-8 md:py-6 rounded-full transform hover:scale-105 transition-transform duration-300"
              >
                Daftar Sekarang & Raih Komisi Partner
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          id="benefits"
          className="py-20 px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10"
                variants={itemVariants}
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-bold text-white">{benefit.title}</h3>
                <p className="mt-2 text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          className="py-20 px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Hanya 3 Langkah Mudah</h2>
            <p className="mt-4 text-gray-400">
              Mulai menghasilkan uang dalam hitungan menit.
            </p>
          </div>
          <div className="mt-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex justify-center items-center w-20 h-20 mx-auto bg-gray-800 border-2 rounded-full text-3xl font-bold" style={{ borderColor: brandColor, color: brandColor }}>1</div>
              <h3 className="text-xl font-semibold text-white">Daftar</h3>
              <p className="text-gray-400">Isi form pendaftaran singkat dalam waktu kurang dari 60 detik.</p>
            </motion.div>
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex justify-center items-center w-20 h-20 mx-auto bg-gray-800 border-2 rounded-full text-3xl font-bold" style={{ borderColor: '#22d3ee', color: '#22d3ee' }}>2</div>
              <h3 className="text-xl font-semibold text-white">Promosi</h3>
              <p className="text-gray-400">Bagikan link unik Anda di berbagai platform sosial media.</p>
            </motion.div>
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex justify-center items-center w-20 h-20 mx-auto bg-gray-800 border-2 rounded-full text-3xl font-bold" style={{ borderColor: '#60a5fa', color: '#60a5fa' }}>3</div>
              <h3 className="text-xl font-semibold text-white">Hasilkan</h3>
              <p className="text-gray-400">Dapatkan komisi instan dari setiap penjualan yang berhasil.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          id="faq"
          className="py-20 px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Pertanyaan Umum</h2>
            <p className="mt-4 text-gray-400">
              Masih punya pertanyaan? Kami punya jawabannya.
            </p>
          </div>
          <div className="mt-12 max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <details className="bg-gray-800/50 p-6 rounded-lg cursor-pointer group border border-gray-700">
                  <summary className="font-semibold text-lg list-none flex justify-between items-center text-white">
                    {faq.question}
                    <span className="transition-transform duration-300 group-open:rotate-45 text-blue-400">+</span>
                  </summary>
                  <p className="mt-4 text-gray-400">{faq.answer}</p>
                </details>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Final CTA Section */}
        <motion.section
          className="py-20 px-4 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <h2 
            className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, #38bdf8)` }}
          >
            Siap Dapat Ratusan Juta Berikutnya?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-300">
            Jangan tunda lagi. Kesempatan emas ada di depan mata. Ribuan partner lain sudah membuktikannya.
          </p>
          <div className="mt-8">
            <Link href="/auth/register?role=AFFILIATE" passHref>
              <Button
                size="lg"
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 4px 30px ${brandColor}40`,
                }}
                className="w-full md:w-auto text-white font-bold text-base md:text-lg px-6 py-5 md:px-8 md:py-6 rounded-full transform hover:scale-105 transition-transform duration-300"
              >
                Daftar & Dapatkan Komisi Pertamamu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </main>
      <PublicFooter />
    </div>
  )
}

export default RichAffiliateLandingPage
