"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Loader2, ArrowLeft, Sparkles, TrendingUp, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import AffiliatePartnerBadge from "@/components/checkout/AffiliatePartnerBadge";

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  features: string[];
  isBestSeller: boolean;
  isMostPopular: boolean;
  formLogo?: string;
  formBanner?: string;
  formDescription?: string;
}

export default function CheckoutAllPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading checkout page...</p>
        </div>
      </div>
    }>
      <CheckoutAllContent />
    </Suspense>
  );
}

function CheckoutAllContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const affiliateCode = searchParams.get("ref") || "";
  const couponCode = searchParams.get("coupon") || "";

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [plans, searchQuery, durationFilter, priceFilter, sortBy]);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/memberships/packages");
      const data = await response.json();

      if (data.success) {
        setPlans(data.packages);
        setFilteredPlans(data.packages);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...plans];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (plan) =>
          plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Duration filter
    if (durationFilter !== "all") {
      filtered = filtered.filter((plan) => plan.duration === durationFilter);
    }

    // Price filter
    if (priceFilter !== "all") {
      if (priceFilter === "low") {
        filtered = filtered.filter((plan) => plan.price < 500000);
      } else if (priceFilter === "mid") {
        filtered = filtered.filter((plan) => plan.price >= 500000 && plan.price < 2000000);
      } else if (priceFilter === "high") {
        filtered = filtered.filter((plan) => plan.price >= 2000000);
      }
    }

    // Sorting
    if (sortBy === "popular") {
      filtered.sort((a, b) => {
        if (a.isBestSeller) return -1;
        if (b.isBestSeller) return 1;
        if (a.isMostPopular) return -1;
        if (b.isMostPopular) return 1;
        return 0;
      });
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "duration") {
      const durationOrder = {
        "ONE_MONTH": 1,
        "THREE_MONTHS": 2,
        "SIX_MONTHS": 3,
        "TWELVE_MONTHS": 4,
        "LIFETIME": 5,
      };
      filtered.sort(
        (a, b) =>
          (durationOrder[a.duration as keyof typeof durationOrder] || 999) -
          (durationOrder[b.duration as keyof typeof durationOrder] || 999)
      );
    }

    setFilteredPlans(filtered);
  };

  const handleSelectPlan = (slug: string) => {
    const params = new URLSearchParams();
    if (affiliateCode) params.append("ref", affiliateCode);
    if (couponCode) params.append("coupon", couponCode);

    router.push(`/membership/${slug}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            All Membership Plans
          </h1>
          <p className="text-lg text-gray-600">
            Find the perfect plan for your export business journey
          </p>
        </div>

        {/* Filters & Search */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filter & Search
                </CardTitle>
                <CardDescription>Find the perfect membership plan</CardDescription>
              </div>
              <Badge variant="outline">
                {filteredPlans.length} Plans Available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search plans or features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Duration Filter */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={durationFilter} onValueChange={setDurationFilter}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="All Durations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Durations</SelectItem>
                    <SelectItem value="ONE_MONTH">1 Month</SelectItem>
                    <SelectItem value="THREE_MONTHS">3 Months</SelectItem>
                    <SelectItem value="SIX_MONTHS">6 Months</SelectItem>
                    <SelectItem value="TWELVE_MONTHS">12 Months</SelectItem>
                    <SelectItem value="LIFETIME">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <Label htmlFor="price">Price Range</Label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger id="price">
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">Under Rp 500K</SelectItem>
                    <SelectItem value="mid">Rp 500K - 2M</SelectItem>
                    <SelectItem value="high">Above Rp 2M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort">
                    <SelectValue placeholder="Popular First" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600">No plans found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setDurationFilter("all");
                  setPriceFilter("all");
                  setSortBy("popular");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const finalPrice = couponCode ? plan.price * 0.9 : plan.price;
              const isPopular = plan.isBestSeller || plan.isMostPopular;

              return (
                <Card
                  key={plan.id}
                  className={`relative shadow-lg transition-all hover:shadow-xl ${
                    isPopular ? "border-2 border-blue-500 ring-4 ring-blue-100" : "border"
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.isBestSeller && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <Badge className="bg-yellow-500 text-white px-3 py-1 shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Best Seller
                      </Badge>
                    </div>
                  )}
                  {plan.isMostPopular && !plan.isBestSeller && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <Badge className="bg-green-500 text-white px-3 py-1 shadow-lg">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  {plan.formBanner && (
                    <img
                      src={plan.formBanner}
                      alt={plan.name}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  )}

                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {plan.formLogo && (
                        <img src={plan.formLogo} alt="Logo" className="h-12 w-12 rounded" />
                      )}
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.duration}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Pricing */}
                    <div>
                      {plan.originalPrice && (
                        <div className="text-sm text-gray-400 line-through">
                          Rp {plan.originalPrice.toLocaleString("id-ID")}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </div>
                      {couponCode && (
                        <Badge variant="outline" className="text-green-600 text-xs">
                          Discount Applied!
                        </Badge>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2 min-h-[200px]">
                      {plan.features.slice(0, 5).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 5 && (
                        <p className="text-xs text-gray-500">
                          +{plan.features.length - 5} more features
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      size="lg"
                      className={`w-full ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-800 hover:bg-gray-900"
                      }`}
                      onClick={() => handleSelectPlan(plan.slug)}
                    >
                      Choose Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <AffiliatePartnerBadge className="mb-6" />
          <p className="text-gray-600 mb-4">
            Need help choosing the right plan?
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/checkout/compare">
              <Button variant="outline" size="lg">
                Compare Plans
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
