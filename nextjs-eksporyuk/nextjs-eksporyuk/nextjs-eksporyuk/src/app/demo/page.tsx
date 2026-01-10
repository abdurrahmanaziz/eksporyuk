'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎯 Demo Sistem Membership & Affiliate
          </h1>
          <p className="text-xl text-gray-600">
            Test semua fitur membership dan sistem bagi hasil affiliate
          </p>
          <Badge className="mt-2 bg-green-100 text-green-800">
            DEMO MODE - Tanpa Database
          </Badge>
        </div>

        {/* Login Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Login Demo */}
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardHeader>
              <CardTitle className="text-indigo-800">🔐 Login System</CardTitle>
              <CardDescription>
                Test sistem login dengan berbagai role user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1">
                <li>✅ 6 Demo Users</li>
                <li>✅ Multi-role dashboard</li>
                <li>✅ Session management</li>
                <li>✅ Auto redirect after login</li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Test Login System
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pricing Demo */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-800">📋 Halaman Pricing</CardTitle>
              <CardDescription>
                Test halaman pricing dengan 4 paket membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1">
                <li>✅ 4 Paket (1, 3, 6, 12 bulan)</li>
                <li>✅ Diskon hingga 55%</li>
                <li>✅ Badge "Paling Laris"</li>
                <li>✅ FAQ & Trust Badges</li>
              </ul>
              <Link href="/pricing">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Test Pricing Page
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Affiliate Tracking Demo */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-orange-800">🔗 Affiliate Tracking</CardTitle>
              <CardDescription>
                Test tracking affiliate dengan URL referral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1">
                <li>✅ URL: ?ref=AFFILIATE123</li>
                <li>✅ Cookie tracking</li>
                <li>✅ 30% komisi affiliate</li>
                <li>✅ Auto revenue split</li>
              </ul>
              <Link href="/pricing?ref=AFFILIATE123">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Test Affiliate Tracking
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Checkout Demo */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800">💳 Unified Checkout</CardTitle>
              <CardDescription>
                Checkout page satu halaman seperti dibales.ai
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1">
                <li>✅ Semua paket dalam satu page</li>
                <li>✅ Form data user</li>
                <li>✅ Payment methods</li>
                <li>✅ Revenue split automatic</li>
              </ul>
              <Link href="/checkout-unified">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Test Unified Checkout
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Demo */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-purple-800">⚙️ Admin Panel</CardTitle>
              <CardDescription>
                Test admin panel untuk kelola membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1">
                <li>✅ Statistics dashboard</li>
                <li>✅ Revenue calculator</li>
                <li>✅ Package management</li>
                <li>✅ Member monitoring</li>
              </ul>
              <Link href="/admin">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Test Admin Panel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Login Info */}
        <Card className="mt-8 border-indigo-300 bg-indigo-50">
          <CardHeader>
            <CardTitle>👥 Demo User Accounts</CardTitle>
            <CardDescription>
              Akun demo yang tersedia untuk testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-red-600">ADMIN</div>
                <div className="text-xs mt-1">admin@eksporyuk.com</div>
                <div className="text-xs text-gray-500">Budi Administrator</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-orange-600">MENTOR (Founder)</div>
                <div className="text-xs mt-1">mentor@eksporyuk.com</div>
                <div className="text-xs text-gray-500">Dinda Mentor - 60% share</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-purple-600">MENTOR (Co-Founder)</div>
                <div className="text-xs mt-1">cofounder@eksporyuk.com</div>
                <div className="text-xs text-gray-500">Andi Mentor - 40% share</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-green-600">AFFILIATE</div>
                <div className="text-xs mt-1">affiliate@eksporyuk.com</div>
                <div className="text-xs text-gray-500">Rina Affiliate</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-blue-600">MEMBER PREMIUM</div>
                <div className="text-xs mt-1">premium@eksporyuk.com</div>
                <div className="text-xs text-gray-500">Dodi Premium Member</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-gray-600">MEMBER FREE</div>
                <div className="text-xs mt-1">free@eksporyuk.com</div>
                <div className="text-xs text-gray-500">Andi Free Member</div>
              </div>
            </div>
            <div className="text-center mt-4 p-3 bg-yellow-100 rounded-lg">
              <div className="font-semibold text-yellow-800">Password untuk semua akun:</div>
              <code className="bg-yellow-200 px-2 py-1 rounded text-yellow-900 font-mono">password123</code>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Split Preview */}
        <Card className="mt-8 border-gray-300">
          <CardHeader>
            <CardTitle>📊 Revenue Split Formula</CardTitle>
            <CardDescription>
              Cara pembagian hasil untuk setiap transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="font-mono text-sm">
                <div className="font-bold mb-2">Contoh: Paket 6 Bulan (Rp 449.000)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-green-600">• Affiliate (30%): Rp 134.700</div>
                    <div className="text-blue-600">• Admin (15%): Rp 67.350</div>
                  </div>
                  <div>
                    <div className="text-orange-600">• Founder (33%): Rp 148.170</div>
                    <div className="text-purple-600">• Co-Founder (22%): Rp 98.780</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  * Jika tidak ada affiliate, 30% masuk ke company
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/checkout-unified?package=6-month&ref=AFFILIATE123">
            <Button variant="outline" className="w-full h-16 text-left">
              <div>
                <div className="font-semibold">Scenario 1</div>
                <div className="text-xs">Dengan Affiliate</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/checkout-unified?package=6-month">
            <Button variant="outline" className="w-full h-16 text-left">
              <div>
                <div className="font-semibold">Scenario 2</div>
                <div className="text-xs">Tanpa Affiliate</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/checkout-unified?package=12-month&ref=TOPAFFILIATE">
            <Button variant="outline" className="w-full h-16 text-left">
              <div>
                <div className="font-semibold">Scenario 3</div>
                <div className="text-xs">Paket 12 Bulan</div>
              </div>
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            💡 Klik tombol manapun untuk test fitur. Semua data adalah mock data untuk demo.
          </p>
        </div>
      </div>
    </div>
  )
}