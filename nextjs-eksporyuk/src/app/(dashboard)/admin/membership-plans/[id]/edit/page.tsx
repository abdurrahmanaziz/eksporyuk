"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ResponsivePageWrapper from "@/components/layout/ResponsivePageWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Bell, Package, Info, Check, Database, MessageCircle, FileText, Users, Wallet, GraduationCap, BarChart3, Megaphone, Calendar, Globe, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

// Feature definitions for membership
const MEMBERSHIP_FEATURE_OPTIONS = [
  // Keuangan
  { key: 'wallet_access', name: 'Akses Dompet', description: 'Akses fitur dompet digital & withdrawal', category: 'Keuangan', icon: Wallet },
  { key: 'revenue_share', name: 'Bagi Hasil', description: 'Aktifkan bagi hasil revenue', category: 'Keuangan', icon: Wallet },
  
  // Pendidikan
  { key: 'course_access', name: 'Akses Kursus', description: 'Akses kursus dengan sertifikat', category: 'Pendidikan', icon: GraduationCap },
  { key: 'webinar_access', name: 'Akses Webinar', description: 'Akses webinar live & recording', category: 'Pendidikan', icon: GraduationCap },
  { key: 'mentoring_access', name: 'Akses Mentoring', description: 'Sesi mentoring 1-on-1', category: 'Pendidikan', icon: GraduationCap },
  { key: 'certificate_access', name: 'Akses Sertifikat', description: 'Download sertifikat', category: 'Pendidikan', icon: GraduationCap },
  
  // Database Ekspor
  { key: 'database_buyer', name: 'Database Buyer', description: 'Akses database buyer/importir', category: 'Database', icon: Database },
  { key: 'database_supplier', name: 'Database Supplier', description: 'Akses database supplier', category: 'Database', icon: Database },
  { key: 'database_forwarder', name: 'Database Forwarder', description: 'Akses database forwarder', category: 'Database', icon: Database },
  { key: 'database_export', name: 'Export Database', description: 'Export database ke CSV/Excel', category: 'Database', icon: Database },
  
  // Komunitas & Chat
  { key: 'chat_access', name: 'Akses Chat', description: 'Akses chat DM & grup', category: 'Komunitas', icon: MessageCircle },
  { key: 'community_access', name: 'Akses Komunitas', description: 'Akses feed, post, komentar', category: 'Komunitas', icon: Users },
  { key: 'group_access', name: 'Akses Grup', description: 'Akses grup private/public', category: 'Komunitas', icon: Users },
  { key: 'member_directory', name: 'Direktori Member', description: 'Akses direktori member', category: 'Komunitas', icon: Users },
  
  // Dokumen
  { key: 'document_templates', name: 'Template Dokumen', description: 'Akses template dokumen ekspor', category: 'Dokumen', icon: FileText },
  { key: 'document_generator', name: 'Generator Dokumen', description: 'Generate dokumen dengan auto-fill', category: 'Dokumen', icon: FileText },
  
  // Marketing & Affiliate
  { key: 'affiliate_access', name: 'Akses Affiliate', description: 'Jadi affiliate & dapat komisi', category: 'Marketing', icon: Megaphone },
  { key: 'marketing_kit', name: 'Kit Marketing', description: 'Akses banner, copy, assets', category: 'Marketing', icon: Megaphone },
  
  // Event
  { key: 'event_access', name: 'Akses Event', description: 'Akses semua event', category: 'Event', icon: Calendar },
  
  // Analitik
  { key: 'analytics_access', name: 'Akses Analitik', description: 'Dashboard analitik & laporan', category: 'Analitik', icon: BarChart3 },
  
  // Fitur Lanjutan
  { key: 'priority_support', name: 'Support Prioritas', description: 'Dukungan prioritas', category: 'Premium', icon: Shield },
  { key: 'early_access', name: 'Akses Awal', description: 'Akses fitur beta', category: 'Premium', icon: Zap },
  { key: 'premium_content', name: 'Konten Premium', description: 'Akses konten eksklusif', category: 'Premium', icon: Zap },
];

const FEATURE_CATEGORIES = ['Keuangan', 'Pendidikan', 'Database', 'Komunitas', 'Dokumen', 'Marketing', 'Event', 'Analitik', 'Premium'];

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Group {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

export default function EditMembershipPlanPage() {
  const router = useRouter();
  const params = useParams();
  const membershipId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFeatureAccess, setSelectedFeatureAccess] = useState<string[]>([]);
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    churnRate: 0,
    growthRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

    // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    marketingPrice: undefined as number | undefined, // Optional marketing price
    marketingBadge: null as "PALING_LARIS" | "HARGA_HEMAT" | "PROMO_GEDE" | "PROMO_GENDENG" | "PROMO_AKHIR_TAHUN" | "PROMO_AWAL_TAHUN" | null,
    duration: "SIX_MONTHS" as "ONE_MONTH" | "THREE_MONTHS" | "SIX_MONTHS" | "TWELVE_MONTHS" | "LIFETIME",
    status: "DRAFT",
    features: [] as string[],
    
    // Access & Benefits
    groupId: "",
    groups: [] as string[],
    courses: [] as string[],
    products: [] as string[],
    benefits: [] as string[],
    
    // Marketing
    salesPageUrl: "",
    buttonText: "Beli Membership",
    formLogo: "",
    formBanner: "",    // SEO
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    
    // Commission Settings
    affiliateEnabled: true,
    commissionType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
    affiliateCommissionRate: 30,
    
    // Settings
    maxMembers: 0,
    autoRenewal: true,
    trialDays: 0,
    isVisible: true,
    isActive: true, // For Draft/Active status - this is the main status field
    showInGeneralCheckout: true,
  });

  const [featureInput, setFeatureInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [membershipId]);

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const statsRes = await fetch(`/api/admin/membership-plans/${membershipId}/statistics`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData.statistics || statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch membership data
      const membershipRes = await fetch(`/api/admin/membership-plans/${membershipId}`);
      if (!membershipRes.ok) throw new Error("Failed to fetch membership data");
      const membershipData = await membershipRes.json();
      const membership = membershipData.plan; // API returns { plan: ... }
      
      // Fetch courses
      const coursesRes = await fetch("/api/admin/courses");
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
      
      // Fetch groups
      const groupsRes = await fetch("/api/admin/groups");
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }

      // Fetch products
      const productsRes = await fetch("/api/admin/products");
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
      
      // Parse features from DB (always flat array)
      let benefitsFromDB: string[] = [];
      if (Array.isArray(membership.features)) {
        benefitsFromDB = [...new Set(membership.features as string[])]; // Remove any duplicates
      } else if (typeof membership.features === 'string') {
        try {
          const parsed = JSON.parse(membership.features);
          if (Array.isArray(parsed)) {
            benefitsFromDB = [...new Set(parsed as string[])];
          }
        } catch {}
      }
      
      // Set form data
      setFormData({
        name: membership.name || "",
        slug: membership.slug || "",
        description: membership.description || "",
        price: membership.price || 0,
        // PENTING: Database field adalah originalPrice, bukan marketingPrice!
        marketingPrice: membership.originalPrice ? Number(membership.originalPrice) : undefined,
        marketingBadge: membership.marketingBadge || null,
        duration: membership.duration || "SIX_MONTHS",
        status: membership.status || "DRAFT",
        features: [], // Empty - features are display only (badges)
        groupId: membership.groupId || "",
        groups: membership.membershipGroups?.map((mg: any) => mg.groupId) || [],
        courses: membership.membershipCourses?.map((mc: any) => mc.courseId) || [],
        products: membership.membershipProducts?.map((mp: any) => mp.productId) || [],
        benefits: benefitsFromDB,
        salesPageUrl: membership.salesPageUrl || "",
        buttonText: membership.buttonText || "Beli Membership",
        formLogo: membership.formLogo || "",
        formBanner: membership.formBanner || "",
        metaTitle: membership.metaTitle || "",
        metaDescription: membership.metaDescription || "",
        metaKeywords: membership.metaKeywords || "",
        affiliateEnabled: membership.affiliateEnabled ?? true,
        commissionType: membership.commissionType || "PERCENTAGE",
        affiliateCommissionRate: Number(membership.affiliateCommissionRate) || 30,
        maxMembers: membership.maxMembers || 0,
        autoRenewal: membership.autoRenewal ?? true,
        trialDays: membership.trialDays || 0,
        isVisible: membership.isVisible ?? true,
        isActive: membership.isActive ?? true,
        showInGeneralCheckout: membership.showInGeneralCheckout ?? true,
      });
      
      // Load enabled feature access
      const enabledFeatures = membership.membershipFeatures
        ?.filter((f: any) => f.enabled)
        ?.map((f: any) => f.featureKey) || [];
      setSelectedFeatureAccess(enabledFeatures);
      
    } catch (error: any) {
      toast.error(error.message || "Gagal load data membership");
      console.error("Load error:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.name?.trim()) {
      toast.error('Nama paket wajib diisi!');
      return;
    }

    if (!formData.slug?.trim()) {
      toast.error('Slug wajib diisi!');
      return;
    }

    if (formData.price < 0) {
      toast.error('Harga tidak boleh negatif!');
      return;
    }

    // Validate duration is a valid enum
    const validDurations = ['SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME'];
    if (!validDurations.includes(formData.duration)) {
      toast.error('Durasi membership tidak valid!');
      return;
    }

    try {
      setLoading(true);

      // Upload logo jika ada
      if (logoFile) {
        try {
          const logoFormData = new FormData();
          logoFormData.append('file', logoFile);
          const logoRes = await fetch('/api/upload', {
            method: 'POST',
            body: logoFormData,
          });
          if (logoRes.ok) {
            const logoData = await logoRes.json();
            formData.formLogo = logoData.url;
          } else {
            throw new Error('Gagal upload logo');
          }
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          toast.error('Gagal upload logo, melanjutkan tanpa logo baru');
        }
      }

      // Upload banner jika ada
      if (bannerFile) {
        try {
          const bannerFormData = new FormData();
          bannerFormData.append('file', bannerFile);
          const bannerRes = await fetch('/api/upload', {
            method: 'POST',
            body: bannerFormData,
          });
          if (bannerRes.ok) {
            const bannerData = await bannerRes.json();
            formData.formBanner = bannerData.url;
          } else {
            throw new Error('Gagal upload banner');
          }
        } catch (uploadError) {
          console.error('Banner upload error:', uploadError);
          toast.error('Gagal upload banner, melanjutkan tanpa banner baru');
        }
      }

      // Combine features and benefits as flat array (benefits go to DB, features are just display)
      // Use Set to remove duplicates before saving
      const allBenefits = [
        ...(Array.isArray(formData.features) ? formData.features : []),
        ...(Array.isArray(formData.benefits) ? formData.benefits : [])
      ];
      const uniqueBenefits = [...new Set(allBenefits)].filter(b => b && b.trim());

      // Only send fields that exist in the Membership schema
      const updatePayload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || '',
        price: Math.max(0, formData.price), // Ensure non-negative
        // PENTING: Database field adalah originalPrice, bukan marketingPrice!
        originalPrice: formData.marketingPrice ? Number(formData.marketingPrice) : null,
        marketingBadge: formData.marketingBadge || null,
        duration: formData.duration,
        status: formData.status,
        isActive: formData.status === 'PUBLISHED', // Auto-set isActive based on status
        salesPageUrl: formData.salesPageUrl?.trim() || '',
        formLogo: formData.formLogo || '',
        formBanner: formData.formBanner || '',
        showInGeneralCheckout: formData.showInGeneralCheckout,
        // Affiliate settings
        affiliateEnabled: formData.affiliateEnabled,
        commissionType: formData.commissionType,
        affiliateCommissionRate: Number(formData.affiliateCommissionRate) || 30,
        features: uniqueBenefits,
        featureAccess: selectedFeatureAccess,
        groups: formData.groups.filter(g => g), // Remove empty values
        courses: formData.courses.filter(c => c), // Remove empty values
        products: formData.products.filter(p => p), // Remove empty values
      };

      console.log('Update payload:', updatePayload); // Debug log

      const response = await fetch(`/api/admin/membership-plans/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      // Show success with summary
      const summary = data.summary;
      let successMessage = 'Membership plan berhasil diupdate!';
      
      if (summary && summary.changedFields > 0) {
        successMessage += `\n\n✅ ${summary.changedFields} field diupdate`;
        
        // Add relationship summary
        const relationships = [];
        if (summary.relationshipsUpdated?.groups !== undefined) {
          relationships.push(`${summary.relationshipsUpdated.groups} grup`);
        }
        if (summary.relationshipsUpdated?.courses !== undefined) {
          relationships.push(`${summary.relationshipsUpdated.courses} kursus`);
        }
        if (summary.relationshipsUpdated?.products !== undefined) {
          relationships.push(`${summary.relationshipsUpdated.products} produk`);
        }
        if (summary.relationshipsUpdated?.features !== undefined) {
          relationships.push(`${summary.relationshipsUpdated.features} fitur akses`);
        }
        
        if (relationships.length > 0) {
          successMessage += `\n📊 Relasi: ${relationships.join(', ')}`;
        }
      }

      toast.success(successMessage, { duration: 5000 });
      
      // Refresh statistics after update
      await fetchStatistics();
      
      // Optional: redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/admin/membership-plans');
      }, 1500);
      
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat update membership');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
      setFormData({
        ...formData,
        features: [...currentFeatures, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
    setFormData({
      ...formData,
      features: currentFeatures.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      const currentBenefits = Array.isArray(formData.benefits) ? formData.benefits : [];
      setFormData({
        ...formData,
        benefits: [...currentBenefits, benefitInput.trim()],
      });
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    const currentBenefits = Array.isArray(formData.benefits) ? formData.benefits : [];
    setFormData({
      ...formData,
      benefits: currentBenefits.filter((_, i) => i !== index),
    });
  };

  const toggleFeatureAccess = (featureKey: string) => {
    setSelectedFeatureAccess(prev => 
      prev.includes(featureKey)
        ? prev.filter(k => k !== featureKey)
        : [...prev, featureKey]
    );
  };

  const selectAllFeaturesInCategory = (category: string) => {
    const categoryFeatures = MEMBERSHIP_FEATURE_OPTIONS
      .filter(f => f.category === category)
      .map(f => f.key);
    const allSelected = categoryFeatures.every(f => selectedFeatureAccess.includes(f));
    
    if (allSelected) {
      setSelectedFeatureAccess(prev => prev.filter(f => !categoryFeatures.includes(f)));
    } else {
      setSelectedFeatureAccess(prev => [...new Set([...prev, ...categoryFeatures])]);
    }
  };

  const toggleCourse = (courseId: string) => {
    const courses = formData.courses.includes(courseId)
      ? formData.courses.filter(id => id !== courseId)
      : [...formData.courses, courseId];
    setFormData({ ...formData, courses });
  };

  const toggleProduct = (productId: string) => {
    const products = formData.products.includes(productId)
      ? formData.products.filter(id => id !== productId)
      : [...formData.products, productId];
    setFormData({ ...formData, products });
  };

  const toggleGroup = (groupId: string) => {
    const groups = formData.groups.includes(groupId)
      ? formData.groups.filter(id => id !== groupId)
      : [...formData.groups, groupId];
    setFormData({ ...formData, groups });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin/membership-plans">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Membership Plan</h1>
        <p className="text-muted-foreground mt-1">
          Update membership plan dengan sistem tab yang mudah
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-2xl">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                statistics.totalMembers.toLocaleString('id-ID')
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{statistics.activeMembers} aktif</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                new Intl.NumberFormat('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(statistics.totalRevenue)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Wallet className="h-4 w-4" />
              <span>
                {new Intl.NumberFormat('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(statistics.thisMonthRevenue)} bulan ini
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Order Value</CardDescription>
            <CardTitle className="text-2xl">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                new Intl.NumberFormat('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(statistics.averageOrderValue)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Per transaksi</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Growth Rate</CardDescription>
            <CardTitle className="text-2xl">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${statistics.growthRate > 0 ? '+' : ''}${statistics.growthRate.toFixed(1)}%`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>30 hari terakhir</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="badge">Badge Promo</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>
                  Informasi utama membership plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Membership *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    placeholder="Contoh: Premium Membership"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="premium-membership"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    URL: /membership/{formData.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Deskripsi lengkap membership..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Pricing */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Harga & Durasi</CardTitle>
                <CardDescription>
                  Pengaturan harga dan durasi membership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="299000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Harga membership dalam Rupiah
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketingPrice">Harga Coret / Marketing Price (Rp) - Optional</Label>
                  <Input
                    id="marketingPrice"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.marketingPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        marketingPrice: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Contoh: 10000000"
                  />
                  <p className="text-sm text-muted-foreground">
                    💡 Harga coret untuk efek marketing (misal: <span className="line-through">Rp 10.000.000</span> → Rp 1.998.000). Kosongkan jika tidak perlu.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durasi Membership</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value: "ONE_MONTH" | "THREE_MONTHS" | "SIX_MONTHS" | "TWELVE_MONTHS" | "LIFETIME") =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_MONTH">1 Bulan</SelectItem>
                      <SelectItem value="THREE_MONTHS">3 Bulan</SelectItem>
                      <SelectItem value="SIX_MONTHS">6 Bulan</SelectItem>
                      <SelectItem value="TWELVE_MONTHS">12 Bulan</SelectItem>
                      <SelectItem value="LIFETIME">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.duration === 'ONE_MONTH' && '30 hari akses member'}
                    {formData.duration === 'THREE_MONTHS' && '90 hari akses member'}
                    {formData.duration === 'SIX_MONTHS' && '180 hari akses member'}
                    {formData.duration === 'TWELVE_MONTHS' && '365 hari akses member'}
                    {formData.duration === 'LIFETIME' && 'Akses selamanya tanpa batas waktu'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Period (Hari)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trialDays: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    0 = tidak ada trial period
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Auto Renewal</Label>
                    <p className="text-sm text-muted-foreground">
                      Membership akan diperpanjang otomatis
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoRenewal}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoRenewal: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Tampil di Checkout Umum</Label>
                    <p className="text-sm text-muted-foreground">
                      Tampilkan membership ini di halaman /checkout/pro
                    </p>
                  </div>
                  <Switch
                    checked={formData.showInGeneralCheckout}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showInGeneralCheckout: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Commission Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Pengaturan Komisi Affiliate
                </CardTitle>
                <CardDescription>
                  Atur tipe komisi dan nilai komisi untuk affiliate yang menjual membership ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable Affiliate Toggle - NEW */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Bisa di-Affiliate-kan
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Jika aktif, membership ini akan tampil di dashboard affiliate dan bisa dipromosikan
                    </p>
                  </div>
                  <Switch
                    checked={formData.affiliateEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, affiliateEnabled: checked })
                    }
                  />
                </div>

                {/* Commission settings - only show if affiliate enabled */}
                {formData.affiliateEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="commissionType">Tipe Komisi Affiliate</Label>
                      <Select
                        value={formData.commissionType}
                        onValueChange={(value: "PERCENTAGE" | "FLAT") =>
                          setFormData({ ...formData, commissionType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                          <SelectItem value="FLAT">Nominal Tetap (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {formData.commissionType === 'PERCENTAGE' 
                      ? 'Komisi dihitung berdasarkan persentase dari harga' 
                      : 'Komisi dengan nominal tetap per transaksi'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliateCommissionRate">
                    {formData.commissionType === "PERCENTAGE"
                      ? "Persentase Komisi (%)"
                      : "Nominal Komisi (Rp)"}
                  </Label>
                  <Input
                    id="affiliateCommissionRate"
                    type="number"
                    min="0"
                    step={formData.commissionType === "PERCENTAGE" ? "1" : "1000"}
                    value={formData.affiliateCommissionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affiliateCommissionRate: Number(e.target.value) || 0,
                      })
                    }
                    placeholder={formData.commissionType === "PERCENTAGE" ? "30" : "100000"}
                  />
                  {formData.commissionType === "PERCENTAGE" && (
                    <p className="text-sm text-muted-foreground">
                      Affiliate mendapat {formData.affiliateCommissionRate}% dari harga (Rp {((formData.price * formData.affiliateCommissionRate) / 100).toLocaleString('id-ID')})
                    </p>
                  )}
                  {formData.commissionType === "FLAT" && (
                    <p className="text-sm text-muted-foreground">
                      Affiliate mendapat Rp {formData.affiliateCommissionRate.toLocaleString('id-ID')} per transaksi
                    </p>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-medium">Cara Kerja Komisi:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Affiliate mendapat komisi sesuai setting ini</li>
                        <li>Sisanya dibagi: Admin (15%), Founder (60%), Co-Founder (40%)</li>
                        <li>Komisi affiliate langsung masuk ke balance (bisa ditarik)</li>
                        <li>Komisi admin/founder masuk ke pending revenue (perlu approval)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                  </>
                )}

                {/* Message when affiliate is disabled */}
                {!formData.affiliateEnabled && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Membership ini tidak akan tampil di dashboard affiliate. Aktifkan toggle di atas jika ingin membership ini bisa dipromosikan oleh affiliate.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Access */}
          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Akses & Konten</CardTitle>
                <CardDescription>
                  Atur akses member ke grup dan course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Grup Komunitas</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Tidak ada grup tersedia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {groups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                            onClick={() => toggleGroup(group.id)}
                          >
                            <input
                              type="checkbox"
                              id={`group-${group.id}`}
                              checked={formData.groups.includes(group.id)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`group-${group.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {group.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.groups.length} grup dipilih
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Course yang Dapat Diakses</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Tidak ada course tersedia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                            onClick={() => toggleCourse(course.id)}
                          >
                            <input
                              type="checkbox"
                              id={`course-${course.id}`}
                              checked={formData.courses.includes(course.id)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`course-${course.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {course.title}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.courses.length} course dipilih
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Produk yang Dapat Diakses</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Tidak ada produk tersedia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                            onClick={() => toggleProduct(product.id)}
                          >
                            <input
                              type="checkbox"
                              id={`product-${product.id}`}
                              checked={formData.products.includes(product.id)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`product-${product.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {product.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.products.length} produk dipilih
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Benefits */}
          <TabsContent value="benefits" className="space-y-4">
            {/* Feature Access Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Akses Fitur Membership
                </CardTitle>
                <CardDescription>
                  Pilih fitur yang tersedia untuk member paket ini. Fitur yang dicentang akan otomatis aktif saat member bergabung.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      {selectedFeatureAccess.length} dari {MEMBERSHIP_FEATURE_OPTIONS.length} fitur dipilih
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFeatureAccess(MEMBERSHIP_FEATURE_OPTIONS.map(f => f.key))}
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFeatureAccess([])}
                    >
                      Hapus Semua
                    </Button>
                  </div>
                </div>

                {FEATURE_CATEGORIES.map((category) => {
                  const categoryFeatures = MEMBERSHIP_FEATURE_OPTIONS.filter(f => f.category === category);
                  const selectedCount = categoryFeatures.filter(f => selectedFeatureAccess.includes(f.key)).length;
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{category}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {selectedCount}/{categoryFeatures.length}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => selectAllFeaturesInCategory(category)}
                        >
                          {selectedCount === categoryFeatures.length ? 'Hapus Semua' : 'Pilih Semua'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryFeatures.map((feature) => {
                          const IconComponent = feature.icon;
                          const isSelected = selectedFeatureAccess.includes(feature.key);
                          return (
                            <div
                              key={feature.key}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-green-50 border-green-300 shadow-sm' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => toggleFeatureAccess(feature.key)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <IconComponent className={`h-4 w-4 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                                  <span className={`font-medium text-sm ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                                    {feature.name}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Text Features & Benefits Section */}
            <Card>
              <CardHeader>
                <CardTitle>Fitur & Benefit Teks</CardTitle>
                <CardDescription>
                  Tambahkan fitur dan benefit dalam bentuk teks untuk ditampilkan di halaman checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Features (Teks)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Tambah fitur..."
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature}>
                      Tambah
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(formData.features) && formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() => removeFeature(index)}
                      >
                        {feature}
                        <span className="text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Benefits (Teks)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="Tambah benefit..."
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                    />
                    <Button type="button" onClick={addBenefit}>
                      Tambah
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(formData.benefits) && formData.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md group"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="flex-1">{benefit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Badge Promo */}
          <TabsContent value="badge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Badge Promo Marketing</CardTitle>
                <CardDescription>
                  Pilih badge marketing kekinian untuk menarik perhatian pembeli
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Pilih Badge Promo</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Tidak Ada Badge */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: null })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === null 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">🚫</div>
                        <div className="font-semibold text-sm">Tidak Ada Badge</div>
                        <p className="text-xs text-muted-foreground">Tampilan standar</p>
                      </div>
                    </div>

                    {/* Paling Laris */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: 'PALING_LARIS' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === 'PALING_LARIS' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">🔥</div>
                        <div className="font-semibold text-sm text-orange-600">Paling Laris</div>
                        <p className="text-xs text-muted-foreground">Best seller badge</p>
                      </div>
                    </div>

                    {/* Harga Hemat */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: 'HARGA_HEMAT' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === 'HARGA_HEMAT' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">💰</div>
                        <div className="font-semibold text-sm text-green-600">Harga Hemat</div>
                        <p className="text-xs text-muted-foreground">Value for money</p>
                      </div>
                    </div>

                    {/* Promo Gede */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: 'PROMO_GEDE' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === 'PROMO_GEDE' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">🎉</div>
                        <div className="font-semibold text-sm text-red-600">Promo Gede</div>
                        <p className="text-xs text-muted-foreground">Big discount</p>
                      </div>
                    </div>

                    {/* Promo Gendeng */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: 'PROMO_GENDENG' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === 'PROMO_GENDENG' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">⚡</div>
                        <div className="font-semibold text-sm text-purple-600">Promo Gendeng</div>
                        <p className="text-xs text-muted-foreground">Crazy discount</p>
                      </div>
                    </div>

                    {/* Promo Akhir Tahun */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: 'PROMO_AKHIR_TAHUN' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === 'PROMO_AKHIR_TAHUN' 
                          ? 'border-yellow-500 bg-yellow-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">🎆</div>
                        <div className="font-semibold text-sm text-yellow-600">Promo Akhir Tahun</div>
                        <p className="text-xs text-muted-foreground">Year end sale</p>
                      </div>
                    </div>

                    {/* Promo Awal Tahun */}
                    <div 
                      onClick={() => setFormData({ ...formData, marketingBadge: 'PROMO_AWAL_TAHUN' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.marketingBadge === 'PROMO_AWAL_TAHUN' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="text-3xl">🎊</div>
                        <div className="font-semibold text-sm text-blue-600">Promo Awal Tahun</div>
                        <p className="text-xs text-muted-foreground">New year sale</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Badge */}
                {formData.marketingBadge && (
                  <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50">
                    <Label className="mb-3 block">Preview Badge (Ukuran Real di Checkout - Dengan Animasi)</Label>
                    <div className="flex justify-center">
                      {formData.marketingBadge === 'PALING_LARIS' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md text-xs font-bold shadow-md animate-pulse">
                          <span className="text-sm">🔥</span>
                          <span>PALING LARIS</span>
                        </span>
                      )}
                      {formData.marketingBadge === 'HARGA_HEMAT' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-md text-xs font-bold shadow-md animate-pulse">
                          <span className="text-sm">💰</span>
                          <span>HARGA HEMAT</span>
                        </span>
                      )}
                      {formData.marketingBadge === 'PROMO_GEDE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-md text-xs font-bold shadow-md animate-pulse">
                          <span className="text-sm">🎉</span>
                          <span>PROMO GEDE</span>
                        </span>
                      )}
                      {formData.marketingBadge === 'PROMO_GENDENG' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md text-xs font-bold shadow-lg animate-bounce">
                          <span className="text-sm">⚡</span>
                          <span>PROMO GENDENG</span>
                        </span>
                      )}
                      {formData.marketingBadge === 'PROMO_AKHIR_TAHUN' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md text-xs font-bold shadow-md animate-pulse">
                          <span className="text-sm">🎆</span>
                          <span>PROMO AKHIR TAHUN</span>
                        </span>
                      )}
                      {formData.marketingBadge === 'PROMO_AWAL_TAHUN' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-md text-xs font-bold shadow-md animate-pulse">
                          <span className="text-sm">🎊</span>
                          <span>PROMO AWAL TAHUN</span>
                        </span>
                      )}
                      {formData.marketingBadge === 'PROMO_AWAL_TAHUN' && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold shadow-sm">
                          <span className="text-sm">🎊</span>
                          <span>Awal Tahun</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Badge akan tampil di pojok kanan atas card paket
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Marketing */}
          <TabsContent value="marketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketing & Sales</CardTitle>
                <CardDescription>
                  Pengaturan sales page dan CTA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salesPageUrl">Sales Page URL</Label>
                  <Input
                    id="salesPageUrl"
                    value={formData.salesPageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, salesPageUrl: e.target.value })
                    }
                    placeholder="https://example.com/membership-premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonText">Teks Tombol CTA</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                    placeholder="Beli Membership"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo (Optional)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, formLogo: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.formLogo && (
                    <div className="mt-2">
                      <img src={formData.formLogo} alt="Logo preview" className="h-20 object-contain border rounded" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Logo akan ditampilkan di checkout page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner (Optional)</Label>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, formBanner: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.formBanner && (
                    <div className="mt-2">
                      <img src={formData.formBanner} alt="Banner preview" className="h-32 w-full object-cover border rounded" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Banner akan ditampilkan di checkout page
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Automation & Smart Reminders
                </CardTitle>
                <CardDescription>
                  Setup unlimited automated reminders dengan multi-channel delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 border-2 border-dashed border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Info className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="font-semibold text-base">Fitur Smart Reminder System</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Multi-Channel Delivery</p>
                              <p className="text-xs text-muted-foreground">Email, WhatsApp, Push, In-App</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Flexible Scheduling</p>
                              <p className="text-xs text-muted-foreground">Hours, days, weeks after purchase/expiry</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Smart Timing</p>
                              <p className="text-xs text-muted-foreground">Preferred time, timezone, avoid weekends</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Rich Content</p>
                              <p className="text-xs text-muted-foreground">HTML email, CTA buttons, shortcodes</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Conditional Logic</p>
                              <p className="text-xs text-muted-foreground">Send based on user activity status</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Analytics & Tracking</p>
                              <p className="text-xs text-muted-foreground">Delivery, open, click rates per channel</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-yellow-900">💡 Pro Tip untuk Reminder Automation:</p>
                          <ul className="space-y-1 text-yellow-800 ml-2">
                            <li>• Setup welcome email dalam 1 jam setelah pembelian</li>
                            <li>• Follow-up di hari ke-3 untuk engagement</li>
                            <li>• Reminder sebelum expired (7 hari, 3 hari, 1 hari)</li>
                            <li>• Gunakan conditional logic untuk target user tidak aktif</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={() => router.push(`/admin/membership-plans/${membershipId}/reminders`)}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Bell className="h-5 w-5" />
                        Kelola Smart Reminders
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        💡 Simpan paket membership terlebih dahulu untuk mengatur reminders
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: SEO */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimasi untuk mesin pencari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    placeholder="Premium Membership - Akses Lengkap"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.metaTitle.length}/60 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaDescription: e.target.value,
                      })
                    }
                    placeholder="Dapatkan akses penuh ke semua course dan grup eksklusif..."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.metaDescription.length}/160 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    placeholder="membership, premium, course, komunitas"
                  />
                  <p className="text-sm text-muted-foreground">
                    Pisahkan dengan koma
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 7: Settings */}
          <TabsContent value="settings" className="space-y-4">
            {/* Status Card - Most Important */}
            <Card className={`border-2 ${
              formData.status === 'PUBLISHED' ? 'border-green-500 bg-green-50' : 
              formData.status === 'DRAFT' ? 'border-yellow-500 bg-yellow-50' :
              'border-gray-500 bg-gray-50'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {formData.status === 'PUBLISHED' ? (
                    <>
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-700">Status: PUBLISHED</span>
                    </>
                  ) : formData.status === 'DRAFT' ? (
                    <>
                      <Info className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-700">Status: DRAFT</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">Status: ARCHIVED</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className={
                  formData.status === 'PUBLISHED' ? 'text-green-600' : 
                  formData.status === 'DRAFT' ? 'text-yellow-600' :
                  'text-gray-600'
                }>
                  {formData.status === 'PUBLISHED' 
                    ? 'Membership ini aktif dan bisa diakses oleh user di halaman checkout'
                    : formData.status === 'DRAFT'
                    ? 'Membership ini dalam mode draft dan tidak akan tampil di halaman publik'
                    : 'Membership ini diarsipkan dan tidak akan tampil di halaman publik'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Status Membership</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value, isActive: value === 'PUBLISHED' })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          DRAFT - Tidak tampil di checkout
                        </div>
                      </SelectItem>
                      <SelectItem value="PUBLISHED">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          PUBLISHED - Aktif dan tampil di checkout
                        </div>
                      </SelectItem>
                      <SelectItem value="ARCHIVED">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                          ARCHIVED - Diarsipkan (tidak tampil)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Hanya membership dengan status PUBLISHED yang akan tampil di halaman checkout publik
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Pengaturan lanjutan membership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxMembers: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    0 = unlimited members
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Tampil di Checkout Umum</Label>
                    <p className="text-sm text-muted-foreground">
                      Tampilkan paket ini di halaman /membership
                    </p>
                  </div>
                  <Switch
                    checked={formData.showInGeneralCheckout}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showInGeneralCheckout: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/membership-plans")}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Membership
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  );
}
