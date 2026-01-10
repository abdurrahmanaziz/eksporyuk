'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Star } from 'lucide-react'

const plans = [
	{
		name: '1 Bulan',
		price: '99K',
		period: 'per bulan',
		features: [
			'Akses semua kelas',
			'Akses grup VIP',
			'Event & webinar',
			'Sertifikat digital',
		],
		popular: false,
	},
	{
		name: '3 Bulan',
		price: '249K',
		period: 'hemat 16%',
		features: [
			'Akses semua kelas',
			'Akses grup VIP',
			'Event & webinar',
			'Sertifikat digital',
			'Konsultasi private',
		],
		popular: false,
	},
	{
		name: '6 Bulan',
		price: '449K',
		period: 'hemat 25%',
		features: [
			'Akses semua kelas',
			'Akses grup VIP',
			'Event & webinar',
			'Sertifikat digital',
			'Konsultasi private',
			'Akses seumur hidup komunitas',
		],
		popular: true,
	},
	{
		name: '12 Bulan',
		price: '799K',
		period: 'hemat 33%',
		features: [
			'Akses semua kelas',
			'Akses grup VIP',
			'Event & webinar',
			'Sertifikat digital',
			'Konsultasi private',
			'Akses seumur hidup komunitas',
			'Bonus course eksklusif',
		],
		popular: false,
	},
]

export function PricingSection() {
	return (
		<section id="pricing" className="py-20 bg-white">
			<div className="container mx-auto px-4">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="text-4xl font-bold text-gray-900 mb-4">
						Pilih Paket Belajar Anda
					</h2>
					<p className="text-xl text-gray-600">
						Investasi terbaik untuk masa depan Anda sebagai eksportir.
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
					{plans.map((plan, index) => (
						<div
							key={index}
							className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-2 ${
								plan.popular
									? 'border-blue-500 shadow-2xl shadow-blue-500/30'
									: 'border-gray-200 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50'
							}`}
						>
							{plan.popular && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2">
									<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
										<Star className="w-4 h-4 fill-white" />
										Paling Laris
									</div>
								</div>
							)}

							<div className="text-center mb-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{plan.name}
								</h3>
								<div className="flex items-baseline justify-center gap-1">
									<span className="text-4xl font-bold text-gray-900">
										Rp {plan.price}
									</span>
								</div>
								<p className="text-sm text-gray-500 mt-1">
									{plan.period}
								</p>
							</div>

							<ul className="space-y-3 mb-8">
								{plan.features.map((feature, featureIndex) => (
									<li key={featureIndex} className="flex items-start gap-2">
										<div className="mt-0.5">
											<Check className="w-5 h-5 text-green-500" />
										</div>
										<span className="text-sm text-gray-600">
											{feature}
										</span>
									</li>
								))}
							</ul>

							<Link href="/register" className="block">
								<Button
									className={`w-full ${
										plan.popular
											? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30'
											: 'bg-gray-900 hover:bg-gray-800'
									}`}
								>
									Pilih Paket
								</Button>
							</Link>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
