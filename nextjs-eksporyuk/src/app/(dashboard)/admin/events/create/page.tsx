"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Calendar, Clock, Users, Video } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
}

interface Group {
  id: string;
  name: string;
  slug: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    checkoutSlug: "",
    description: "",
    shortDescription: "",
    price: 0,
    originalPrice: 0,
    category: "event",
    tags: [] as string[],
    thumbnail: "",
    
    // SEO
    seoMetaTitle: "",
    seoMetaDescription: "",
    seoKeywords: "",
    ctaButtonText: "Daftar Sekarang",
    
    // Event fields
    eventDate: "",
    eventEndDate: "",
    eventDuration: 60,
    eventUrl: "",
    meetingId: "",
    meetingPassword: "",
    eventVisibility: "PUBLIC",
    eventPassword: "",
    maxParticipants: 0,
    
    // Settings
    accessLevel: "PUBLIC",
    isActive: true,
    isFeatured: false,
    commissionType: "PERCENTAGE",
    affiliateCommissionRate: 30,
    targetMembershipId: "", // Target membership untuk upgrade dari affiliate
    
    // Reminders
    reminders: {
      reminder7Days: false,
      reminder3Days: false,
      reminder1Day: true,
      reminder1Hour: true,
      reminder15Min: false,
    }
  });

  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [testimonials, setTestimonials] = useState<{ name: string; role: string; content: string; rating: number }[]>([]);
  const [bonuses, setBonuses] = useState<{ title: string; description: string; value?: number }[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membershipRes, groupsRes] = await Promise.all([
        fetch("/api/admin/membership-plans", {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch("/api/admin/groups", {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
      ]);

      if (membershipRes.ok) {
        const data = await membershipRes.json();
        setMembershipPlans(data.plans || []);
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name" && !formData.slug) {
      const slug = generateSlug(value);
      setFormData((prev) => ({ 
        ...prev, 
        slug: slug,
        checkoutSlug: `event-${slug}`
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.eventDate) {
      toast.error("Nama event dan tanggal event wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const eventData: any = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || null,
        eventDuration: Number(formData.eventDuration) || null,
        maxParticipants: Number(formData.maxParticipants) || null,
        affiliateCommissionRate: Number(formData.affiliateCommissionRate) || 30,
        
        // Arrays
        tags: formData.tags.length > 0 ? formData.tags : null,
        images: images.length > 0 ? images : null,
        faqs: faqs.length > 0 ? JSON.stringify(faqs) : null,
        testimonials: testimonials.length > 0 ? JSON.stringify(testimonials) : null,
        bonuses: bonuses.length > 0 ? JSON.stringify(bonuses) : null,
        
        // Membership/Group IDs
        membershipIds: selectedMemberships,
        groupIds: selectedGroups,
        targetMembershipId: formData.targetMembershipId || null,
        
        // Event specific
        eventDate: formData.eventDate || null,
        eventEndDate: formData.eventEndDate || null,
        eventUrl: formData.eventUrl || null,
        meetingId: formData.meetingId || null,
        meetingPassword: formData.meetingPassword || null,
        eventPassword: formData.eventPassword || null,
      };

      const response = await fetch("/api/admin/events", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      toast.success("Event berhasil dibuat!");
      router.push("/admin/events");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Event</h1>
            <p className="text-muted-foreground">
              Buat event, webinar, atau workshop baru
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
            <TabsTrigger value="datetime">Tanggal & Waktu</TabsTrigger>
            <TabsTrigger value="meeting">Detail Meeting</TabsTrigger>
            <TabsTrigger value="visibility">Visibilitas</TabsTrigger>
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar Event</CardTitle>
                <CardDescription>Informasi umum tentang event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Event *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Contoh: Webinar Export Masterclass 2024"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      placeholder="webinar-export-masterclass-2024"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL: /events/{formData.slug || "slug-event"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkoutSlug">Checkout Slug</Label>
                    <Input
                      id="checkoutSlug"
                      value={formData.checkoutSlug}
                      onChange={(e) => handleChange("checkoutSlug", e.target.value)}
                      placeholder="event-webinar-export-masterclass-2024"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL: /checkout/product/{formData.checkoutSlug || "checkout-slug"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Deskripsi Singkat</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleChange("shortDescription", e.target.value)}
                    placeholder="Deskripsi singkat untuk card dan preview"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Lengkap *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Jelaskan detail event, apa yang akan dipelajari peserta..."
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <FileUpload
                    label="Thumbnail Event"
                    value={formData.thumbnail}
                    onChange={(url) => handleChange("thumbnail", url)}
                    type="banner"
                    maxSize={5}
                    previewWidth={320}
                    previewHeight={180}
                  />
                  <p className="text-xs text-muted-foreground">
                    Rekomendasi ukuran: 1280x720px
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (IDR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="0 untuk gratis"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan 0 untuk event gratis
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Harga Asli (IDR)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => handleChange("originalPrice", e.target.value)}
                      placeholder="Harga sebelum diskon"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tampilkan harga coret untuk diskon
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags Event</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagInput.trim()) {
                            handleChange("tags", [...formData.tags, tagInput.trim()]);
                            setTagInput("");
                          }
                        }
                      }}
                      placeholder="Ketik tag dan tekan Enter"
                    />
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              handleChange("tags", formData.tags.filter((_, i) => i !== index));
                            }}
                            className="ml-1 hover:bg-destructive/20 rounded-full"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Date & Time */}
          <TabsContent value="datetime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tanggal & Waktu Event
                </CardTitle>
                <CardDescription>Atur jadwal pelaksanaan event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Tanggal & Waktu Mulai *</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => handleChange("eventDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventEndDate">Tanggal & Waktu Selesai</Label>
                    <Input
                      id="eventEndDate"
                      type="datetime-local"
                      value={formData.eventEndDate}
                      onChange={(e) => handleChange("eventEndDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDuration">Durasi (menit)</Label>
                    <Input
                      id="eventDuration"
                      type="number"
                      value={formData.eventDuration}
                      onChange={(e) => handleChange("eventDuration", e.target.value)}
                      placeholder="60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Perkiraan durasi event dalam menit
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Maksimal Peserta</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange("maxParticipants", e.target.value)}
                      placeholder="0 = unlimited"
                    />
                    <p className="text-xs text-muted-foreground">
                      Kosongkan atau 0 untuk unlimited
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Otomatis
                </CardTitle>
                <CardDescription>Kirim pengingat ke peserta sebelum event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder7Days" className="font-normal">7 hari sebelum event</Label>
                    <Switch
                      id="reminder7Days"
                      checked={formData.reminders.reminder7Days}
                      onCheckedChange={(checked) => 
                        handleChange("reminders", { ...formData.reminders, reminder7Days: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder3Days" className="font-normal">3 hari sebelum event</Label>
                    <Switch
                      id="reminder3Days"
                      checked={formData.reminders.reminder3Days}
                      onCheckedChange={(checked) => 
                        handleChange("reminders", { ...formData.reminders, reminder3Days: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder1Day" className="font-normal">1 hari sebelum event</Label>
                    <Switch
                      id="reminder1Day"
                      checked={formData.reminders.reminder1Day}
                      onCheckedChange={(checked) => 
                        handleChange("reminders", { ...formData.reminders, reminder1Day: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder1Hour" className="font-normal">1 jam sebelum event</Label>
                    <Switch
                      id="reminder1Hour"
                      checked={formData.reminders.reminder1Hour}
                      onCheckedChange={(checked) => 
                        handleChange("reminders", { ...formData.reminders, reminder1Hour: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder15Min" className="font-normal">15 menit sebelum event</Label>
                    <Switch
                      id="reminder15Min"
                      checked={formData.reminders.reminder15Min}
                      onCheckedChange={(checked) => 
                        handleChange("reminders", { ...formData.reminders, reminder15Min: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Meeting Details */}
          <TabsContent value="meeting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Detail Meeting Online
                </CardTitle>
                <CardDescription>Konfigurasi Zoom, Google Meet, atau platform lain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventUrl">URL Meeting/Zoom Link</Label>
                  <Input
                    id="eventUrl"
                    value={formData.eventUrl}
                    onChange={(e) => handleChange("eventUrl", e.target.value)}
                    placeholder="https://zoom.us/j/123456789"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link Zoom, Google Meet, atau platform meeting lainnya
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingId">Meeting ID</Label>
                    <Input
                      id="meetingId"
                      value={formData.meetingId}
                      onChange={(e) => handleChange("meetingId", e.target.value)}
                      placeholder="123 456 7890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingPassword">Meeting Password</Label>
                    <Input
                      id="meetingPassword"
                      value={formData.meetingPassword}
                      onChange={(e) => handleChange("meetingPassword", e.target.value)}
                      placeholder="Password meeting"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Tips:</strong> Link meeting akan dikirimkan ke peserta melalui email setelah pendaftaran berhasil dan reminder sebelum event dimulai.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Visibility */}
          <TabsContent value="visibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Visibilitas Event
                </CardTitle>
                <CardDescription>Atur siapa yang bisa mendaftar event ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventVisibility">Tipe Visibilitas</Label>
                  <Select
                    value={formData.eventVisibility}
                    onValueChange={(value) => handleChange("eventVisibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Publik - Semua orang bisa mendaftar</SelectItem>
                      <SelectItem value="PRIVATE">Private - Perlu password untuk daftar</SelectItem>
                      <SelectItem value="PASSWORD_PROTECTED">Password Protected - Butuh password</SelectItem>
                      <SelectItem value="MEMBERSHIP">Member Only - Khusus member tertentu (GRATIS)</SelectItem>
                      <SelectItem value="GROUP">Group Only - Khusus group tertentu (GRATIS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.eventVisibility === "PASSWORD_PROTECTED" && (
                  <div className="space-y-2">
                    <Label htmlFor="eventPassword">Password Event</Label>
                    <Input
                      id="eventPassword"
                      type="text"
                      value={formData.eventPassword}
                      onChange={(e) => handleChange("eventPassword", e.target.value)}
                      placeholder="Password untuk mendaftar event"
                    />
                  </div>
                )}

                {formData.eventVisibility === "MEMBERSHIP" && (
                  <div className="space-y-2">
                    <Label>Pilih Membership (Member bisa daftar GRATIS)</Label>
                    <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      {membershipPlans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada membership plan</p>
                      ) : (
                        membershipPlans.map((plan) => (
                          <div key={plan.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`membership-${plan.id}`}
                              checked={selectedMemberships.includes(plan.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMemberships([...selectedMemberships, plan.id]);
                                } else {
                                  setSelectedMemberships(
                                    selectedMemberships.filter((id) => id !== plan.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`membership-${plan.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {plan.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedMemberships.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedMemberships.map((id) => {
                          const plan = membershipPlans.find((p) => p.id === id);
                          return plan ? (
                            <Badge key={id} variant="secondary">{plan.name}</Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {formData.eventVisibility === "GROUP" && (
                  <div className="space-y-2">
                    <Label>Pilih Group (Member group bisa daftar GRATIS)</Label>
                    <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      {groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada group</p>
                      ) : (
                        groups.map((group) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedGroups([...selectedGroups, group.id]);
                                } else {
                                  setSelectedGroups(
                                    selectedGroups.filter((id) => id !== group.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`group-${group.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {group.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedGroups.map((id) => {
                          const group = groups.find((g) => g.id === id);
                          return group ? (
                            <Badge key={id} variant="secondary">{group.name}</Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Content */}
          <TabsContent value="content" className="space-y-4">
            {/* FAQ Builder */}
            <Card>
              <CardHeader>
                <CardTitle>FAQ Event</CardTitle>
                <CardDescription>Pertanyaan umum tentang event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>FAQ #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFaqs(faqs.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].question = e.target.value;
                        setFaqs(newFaqs);
                      }}
                      placeholder="Pertanyaan"
                    />
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].answer = e.target.value;
                        setFaqs(newFaqs);
                      }}
                      placeholder="Jawaban"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                >
                  + Tambah FAQ
                </Button>
              </CardContent>
            </Card>

            {/* Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle>Testimoni</CardTitle>
                <CardDescription>Testimoni dari peserta event sebelumnya</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonials.map((testi, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Testimoni #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTestimonials(testimonials.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={testi.name}
                        onChange={(e) => {
                          const newTesti = [...testimonials];
                          newTesti[index].name = e.target.value;
                          setTestimonials(newTesti);
                        }}
                        placeholder="Nama"
                      />
                      <Input
                        value={testi.role}
                        onChange={(e) => {
                          const newTesti = [...testimonials];
                          newTesti[index].role = e.target.value;
                          setTestimonials(newTesti);
                        }}
                        placeholder="Role/Jabatan"
                      />
                    </div>
                    <Textarea
                      value={testi.content}
                      onChange={(e) => {
                        const newTesti = [...testimonials];
                        newTesti[index].content = e.target.value;
                        setTestimonials(newTesti);
                      }}
                      placeholder="Isi testimoni"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestimonials([...testimonials, { name: "", role: "", content: "", rating: 5 }])}
                >
                  + Tambah Testimoni
                </Button>
              </CardContent>
            </Card>

            {/* Bonuses */}
            <Card>
              <CardHeader>
                <CardTitle>Bonus Event</CardTitle>
                <CardDescription>Bonus tambahan untuk peserta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bonuses.map((bonus, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Bonus #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBonuses(bonuses.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <Input
                      value={bonus.title}
                      onChange={(e) => {
                        const newBonuses = [...bonuses];
                        newBonuses[index].title = e.target.value;
                        setBonuses(newBonuses);
                      }}
                      placeholder="Judul bonus"
                    />
                    <Textarea
                      value={bonus.description}
                      onChange={(e) => {
                        const newBonuses = [...bonuses];
                        newBonuses[index].description = e.target.value;
                        setBonuses(newBonuses);
                      }}
                      placeholder="Deskripsi bonus"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBonuses([...bonuses, { title: "", description: "" }])}
                >
                  + Tambah Bonus
                </Button>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle>SEO & Marketing</CardTitle>
                <CardDescription>Optimasi untuk search engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoMetaTitle">SEO Title</Label>
                  <Input
                    id="seoMetaTitle"
                    value={formData.seoMetaTitle}
                    onChange={(e) => handleChange("seoMetaTitle", e.target.value)}
                    placeholder="Judul untuk SEO (max 60 karakter)"
                    maxLength={60}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoMetaDescription">SEO Description</Label>
                  <Textarea
                    id="seoMetaDescription"
                    value={formData.seoMetaDescription}
                    onChange={(e) => handleChange("seoMetaDescription", e.target.value)}
                    placeholder="Deskripsi untuk SEO (max 160 karakter)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seoMetaDescription.length}/160 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctaButtonText">Teks Tombol CTA</Label>
                  <Input
                    id="ctaButtonText"
                    value={formData.ctaButtonText}
                    onChange={(e) => handleChange("ctaButtonText", e.target.value)}
                    placeholder="Daftar Sekarang"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Settings */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Event</CardTitle>
                <CardDescription>Komisi affiliate dan status publikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionType">Tipe Komisi Affiliate</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value) => handleChange("commissionType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FLAT">Flat (IDR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliateCommissionRate">
                    {formData.commissionType === "PERCENTAGE"
                      ? "Komisi Affiliate (%)"
                      : "Komisi Affiliate (IDR)"}
                  </Label>
                  <Input
                    id="affiliateCommissionRate"
                    type="number"
                    value={formData.affiliateCommissionRate}
                    onChange={(e) => handleChange("affiliateCommissionRate", e.target.value)}
                    placeholder={formData.commissionType === "PERCENTAGE" ? "30" : "50000"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetMembershipId">Target Upgrade Membership</Label>
                  <Select
                    value={formData.targetMembershipId || "none"}
                    onValueChange={(value) => handleChange("targetMembershipId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih membership tujuan upgrade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada target</SelectItem>
                      {membershipPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Peserta event dengan affiliate cookies akan diarahkan untuk upgrade ke membership ini
                  </p>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Event Aktif</Label>
                      <p className="text-sm text-muted-foreground">
                        Event dapat dilihat dan didaftari oleh user
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleChange("isActive", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Featured Event</Label>
                      <p className="text-sm text-muted-foreground">
                        Tampilkan di homepage sebagai featured
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleChange("isFeatured", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/events")}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Event
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  );
}
