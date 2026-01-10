"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Membership {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  durationType: string;
  duration: number;
  formLogo: string | null;
  formBanner: string | null;
  features: string[];
  isBestSeller: boolean;
  isMostPopular: boolean;
}

export default function MembershipCheckoutPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      // Use simple public API endpoint that works
      const response = await fetch("/api/memberships");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // This API returns array directly
      const data = await response.json();

      // Validate data is array
      if (!Array.isArray(data)) {
        console.error("Invalid data format received:", data);
        setMemberships([]);
        return;
      }

      // Filter only active memberships
      const filtered = data.filter((m: any) => m.isActive);

      // Normalize features to array
      const normalized = filtered.map((m: any) => {
        let features = m.features || [];
        
        // Parse if string
        if (typeof features === 'string') {
          try {
            features = JSON.parse(features);
          } catch (e) {
            console.error('Failed to parse features:', e);
            features = [];
          }
        }
        
        // Ensure array
        if (!Array.isArray(features)) {
          features = [];
        }
        
        return {
          ...m,
          features
        };
      });

      setMemberships(normalized);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDurationText = (durationType: string, duration: number) => {
    if (durationType === "LIFETIME") return "Lifetime Access";
    if (durationType === "MONTH") return `${duration} Bulan`;
    if (durationType === "YEAR") return `${duration} Tahun`;
    return `${duration} Hari`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Memuat paket membership...</p>
        </div>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Membership Plans</h1>
          <p className="text-muted-foreground">
            Belum ada paket membership yang tersedia saat ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pilih Paket Membership</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Dapatkan akses penuh ke semua kelas dan produk premium kami
        </p>
      </div>

      {/* Membership Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {memberships.map((membership) => {
          const discount = membership.discountPrice
            ? Math.round(
                ((membership.price - membership.discountPrice) /
                  membership.price) *
                  100
              )
            : 0;

          const finalPrice = membership.discountPrice || membership.price;

          return (
            <Card
              key={membership.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                membership.isMostPopular ? "border-primary border-2" : ""
              }`}
            >
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {membership.isBestSeller && (
                  <Badge variant="default" className="bg-orange-500">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Best Seller
                  </Badge>
                )}
                {membership.isMostPopular && (
                  <Badge variant="default" className="bg-blue-500">
                    Most Popular
                  </Badge>
                )}
              </div>

              {/* Banner */}
              {membership.formBanner && (
                <div className="relative h-40 w-full bg-gradient-to-r from-primary/20 to-primary/10">
                  <Image
                    src={membership.formBanner}
                    alt={membership.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <CardHeader className="pb-4">
                {/* Logo */}
                {membership.formLogo && (
                  <div className="mb-4 flex justify-center">
                    <div className="relative w-20 h-20">
                      <Image
                        src={membership.formLogo}
                        alt={membership.name}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <CardTitle className="text-2xl text-center">
                  {membership.name}
                </CardTitle>
                {membership.description && (
                  <CardDescription className="text-center mt-2">
                    {membership.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                {/* Pricing */}
                <div className="text-center mb-6">
                  {discount > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg line-through text-muted-foreground">
                        {formatPrice(membership.price)}
                      </span>
                      <Badge variant="destructive">{discount}% OFF</Badge>
                    </div>
                  )}
                  <div className="text-4xl font-bold mb-1">
                    {formatPrice(finalPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getDurationText(
                      membership.durationType,
                      membership.duration
                    )}
                  </div>
                </div>

                {/* Features */}
                {membership.features && Array.isArray(membership.features) && membership.features.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {membership.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {membership.features.length > 6 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{membership.features.length - 6} fitur lainnya
                      </p>
                    )}
                  </div>
                )}

                {/* CTA Button */}
                <Link href={`/checkout/${membership.slug}`}>
                  <Button className="w-full" size="lg">
                    Pilih Paket Ini
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Become a Supplier CTA */}
      <div className="mt-16 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                  Punya Produk untuk Dijual?
                </h3>
                <p className="text-gray-600 mb-4">
                  Bergabunglah sebagai supplier dan jual produk Anda ke ribuan buyer di platform kami. 
                  Dapatkan akses ke dashboard supplier, katalog produk unlimited, dan fitur premium lainnya.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="bg-white">
                    📦 Katalog Produk
                  </Badge>
                  <Badge variant="secondary" className="bg-white">
                    💬 Chat dengan Buyer
                  </Badge>
                  <Badge variant="secondary" className="bg-white">
                    ✓ Verified Badge
                  </Badge>
                  <Badge variant="secondary" className="bg-white">
                    📊 Analytics
                  </Badge>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Link href="/register-supplier">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Daftar Supplier
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-center text-muted-foreground">
        <p className="text-sm">
          Semua paket dilengkapi dengan garansi uang kembali 30 hari
        </p>
        <p className="text-sm mt-2">
          Butuh bantuan? Hubungi kami di support@eksporyuk.com
        </p>
      </div>
    </div>
  );
}
