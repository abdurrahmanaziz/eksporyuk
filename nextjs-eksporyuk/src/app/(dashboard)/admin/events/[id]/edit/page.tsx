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
import { ArrowLeft, Save, Loader2, Calendar, Clock, Users, Video, Bell } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface Event {
  id: string;
  name: string;
  slug: string;
  checkoutSlug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  category?: string;
  tags?: string | string[];
  eventDate: string;
  eventEndDate?: string;
  eventDuration?: number;
  eventUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  eventVisibility?: string;
  eventPassword?: string;
  maxParticipants?: number;
  accessLevel?: string;
  isActive: boolean;
  isFeatured: boolean;
  commissionType?: string;
  affiliateCommissionRate?: number;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  ctaButtonText?: string;
  reminders?: any;
  eventMemberships?: Array<{ membershipId: string }>;
  eventGroups?: Array<{ groupId: string }>;
}

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

export default function EditEventPage({ params }: { params: { id: string } }) {
  const resolvedParams = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
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
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!resolvedParams.id) return;
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch event
      const eventRes = await fetch(`/api/admin/events/${resolvedParams.id}`);
      if (!eventRes.ok) {
        toast.error("Event tidak ditemukan");
        router.push("/admin/events");
        return;
      }
      
      const eventData = await eventRes.json();
      const ev = eventData.event;

      // Parse tags - handle both JSON array and comma-separated string
      let parsedTags: string[] = [];
      if (ev.tags) {
        if (typeof ev.tags === 'string') {
          if (ev.tags.startsWith('[')) {
            try {
              parsedTags = JSON.parse(ev.tags);
            } catch {
              parsedTags = [];
            }
          } else {
            parsedTags = ev.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
          }
        } else if (Array.isArray(ev.tags)) {
          parsedTags = ev.tags;
        }
      }

      // Parse reminders
      let parsedReminders = {
        reminder7Days: false,
        reminder3Days: false,
        reminder1Day: true,
        reminder1Hour: true,
        reminder15Min: false,
      };
      if (ev.reminders) {
        if (typeof ev.reminders === 'string') {
          parsedReminders = JSON.parse(ev.reminders);
        } else {
          parsedReminders = ev.reminders;
        }
      }

      setEvent(ev);
      setFormData({
        name: ev.name || "",
        slug: ev.slug || "",
        checkoutSlug: ev.checkoutSlug || "",
        description: ev.description || "",
        shortDescription: ev.shortDescription || "",
        price: Number(ev.price) || 0,
        originalPrice: Number(ev.originalPrice) || 0,
        category: ev.category || "event",
        tags: parsedTags,
        thumbnail: ev.thumbnail || "",
        seoMetaTitle: ev.seoMetaTitle || "",
        seoMetaDescription: ev.seoMetaDescription || "",
        ctaButtonText: ev.ctaButtonText || "Daftar Sekarang",
        eventDate: ev.eventDate ? new Date(ev.eventDate).toISOString().slice(0, 16) : "",
        eventEndDate: ev.eventEndDate ? new Date(ev.eventEndDate).toISOString().slice(0, 16) : "",
        eventDuration: Number(ev.eventDuration) || 60,
        eventUrl: ev.eventUrl || "",
        meetingId: ev.meetingId || "",
        meetingPassword: ev.meetingPassword || "",
        eventVisibility: ev.eventVisibility || "PUBLIC",
        eventPassword: ev.eventPassword || "",
        maxParticipants: Number(ev.maxParticipants) || 0,
        accessLevel: ev.accessLevel || "PUBLIC",
        isActive: ev.isActive !== false,
        isFeatured: ev.isFeatured === true,
        commissionType: ev.commissionType || "PERCENTAGE",
        affiliateCommissionRate: Number(ev.affiliateCommissionRate) || 30,
        targetMembershipId: ev.targetMembershipId || "",
        reminders: parsedReminders,
      });

      // Set selected memberships & groups
      setSelectedMemberships(ev.eventMemberships?.map((em: any) => em.membershipId) || []);
      setSelectedGroups(ev.eventGroups?.map((eg: any) => eg.groupId) || []);

      // Fetch reference data
      const [membershipRes, groupsRes] = await Promise.all([
        fetch("/api/admin/membership-plans"),
        fetch("/api/admin/groups"),
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
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.eventDate) {
      toast.error("Nama event dan tanggal event wajib diisi");
      return;
    }

    setSaving(true);

    try {
      const eventData: any = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || null,
        eventDuration: Number(formData.eventDuration) || null,
        maxParticipants: Number(formData.maxParticipants) || null,
        affiliateCommissionRate: Number(formData.affiliateCommissionRate) || 30,
        tags: formData.tags.length > 0 ? formData.tags : null,
        membershipIds: selectedMemberships,
        groupIds: selectedGroups,
        targetMembershipId: formData.targetMembershipId || null,
      };

      const response = await fetch(`/api/admin/events/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengubah event");
      }

      toast.success("Event berhasil diperbarui!");
      router.push("/admin/events");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Memuat event...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
            <p className="text-muted-foreground">{formData.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${resolvedParams.id}/reminders`}>
              <Bell className="h-4 w-4 mr-2" />
              Kelola Reminder
            </Link>
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
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
            <TabsTrigger value="content">Konten & SEO</TabsTrigger>
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
                          if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                            handleChange("tags", [...formData.tags, tagInput.trim()]);
                            setTagInput("");
                          }
                        }
                      }}
                      placeholder="Ketik tag dan tekan Enter"
                    />
                    <Button type="button" variant="outline" onClick={() => {
                      if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                        handleChange("tags", [...formData.tags, tagInput.trim()]);
                        setTagInput("");
                      }
                    }}>
                      Tambah
                    </Button>
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

          {/* Tab 5: Content & SEO */}
          <TabsContent value="content" className="space-y-4">
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
          <Button variant="outline" asChild>
            <Link href="/admin/events">Batal</Link>
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  );
}
