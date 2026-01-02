"use client";

import { useState, useEffect } from "react";
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, Users, Plus, MoreHorizontal, Pencil, Trash2, Eye, DollarSign, Video } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Event {
  id: string;
  name: string;
  slug: string;
  checkoutSlug?: string;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  shortDescription?: string;
  eventDate: string;
  eventEndDate?: string;
  eventDuration?: number;
  eventUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  maxParticipants?: number;
  eventVisibility?: string;
  isActive: boolean;
  isFeatured: boolean;
  productStatus?: string;
  accessLevel?: string;
  salesPageUrl?: string;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    UserProduct: number;
  };
}

interface StatsData {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  upcomingEvents: number;
  ongoingEvents: number;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    eventId: string | null;
    eventName: string;
  }>({
    open: false,
    eventId: null,
    eventName: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, statusFilter, visibilityFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('[Events] Fetching events from API...');
      const response = await fetch("/api/admin/events", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[Events] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Events] API error:', errorData);
        throw new Error(errorData.error || "Failed to fetch events");
      }
      
      const data = await response.json();
      console.log('[Events] Data received:', data);
      console.log('[Events] Events count:', data.events?.length || 0);
      
      setEvents(data.events || []);
      calculateStats(data.events || []);
    } catch (error) {
      console.error("[Events] Error fetching events:", error);
      toast.error("Gagal memuat event");
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.eventDate);
    const endDate = event.eventEndDate ? new Date(event.eventEndDate) : null;

    if (startDate > now) return 'upcoming';
    if (endDate && endDate >= now && startDate <= now) return 'ongoing';
    return 'past';
  };

  const calculateStats = (eventsData: Event[]) => {
    const totalEvents = eventsData.length;
    const totalAttendees = eventsData.reduce(
      (sum, e) => sum + (e._count?.UserProduct || 0),
      0
    );
    const totalRevenue = eventsData.reduce((sum, e) => {
      const attendees = e._count?.UserProduct || 0;
      return sum + attendees * e.price;
    }, 0);
    
    const upcomingEvents = eventsData.filter(e => getEventStatus(e) === 'upcoming').length;
    const ongoingEvents = eventsData.filter(e => getEventStatus(e) === 'ongoing').length;

    setStats({
      totalEvents,
      totalAttendees,
      totalRevenue,
      upcomingEvents,
      ongoingEvents,
    });
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((e) => getEventStatus(e) === statusFilter.toLowerCase());
    }

    if (visibilityFilter !== "ALL") {
      filtered = filtered.filter((e) => e.eventVisibility === visibilityFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDialog.eventId) return;

    try {
      const response = await fetch(`/api/admin/events/${deleteDialog.eventId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Event berhasil dihapus");
      fetchEvents();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error(error.message || "Gagal menghapus event");
    } finally {
      setDeleteDialog({ open: false, eventId: null, eventName: "" });
    }
  };

  const getStatusBadge = (event: Event) => {
    const status = getEventStatus(event);
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; text: string }> = {
      upcoming: { variant: "default", text: "Akan Datang" },
      ongoing: { variant: "secondary", text: "Sedang Berlangsung" },
      past: { variant: "outline", text: "Selesai" },
    };
    return variants[status] || variants.past;
  };

  const getVisibilityLabel = (visibility?: string) => {
    const labels: Record<string, string> = {
      PUBLIC: "Publik",
      PRIVATE: "Private",
      PASSWORD_PROTECTED: "Password",
      MEMBERSHIP: "Member Only",
      GROUP: "Group Only",
    };
    return labels[visibility || "PUBLIC"] || visibility;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: localeId });
    } catch {
      return "-";
    }
  };

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event & Webinar</h1>
          <p className="text-muted-foreground">
            Kelola event, webinar, dan workshop online
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Event
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Event</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Semua event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akan Datang</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Event mendatang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Berlangsung</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ongoingEvents}</div>
            <p className="text-xs text-muted-foreground">Event aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">Semua pendaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total pendapatan event</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>Cari dan filter event sesuai kebutuhan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau slug event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="UPCOMING">Akan Datang</SelectItem>
                <SelectItem value="ONGOING">Sedang Berlangsung</SelectItem>
                <SelectItem value="PAST">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Visibilitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Visibilitas</SelectItem>
                <SelectItem value="PUBLIC">Publik</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="PASSWORD_PROTECTED">Password Protected</SelectItem>
                <SelectItem value="MEMBERSHIP">Member Only</SelectItem>
                <SelectItem value="GROUP">Group Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Event ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat event...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada event. Klik tombol "Tambah Event" untuk membuat event baru.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibilitas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const statusInfo = getStatusBadge(event);
                    const attendeeCount = event._count?.UserProduct || 0;
                    const hasCapacity = event.maxParticipants && event.maxParticipants > 0;
                    const isFull = hasCapacity && attendeeCount >= (event.maxParticipants || 0);

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>{event.name}</span>
                              {event.isFeatured && (
                                <Badge variant="secondary" className="text-xs">Featured</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{event.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">{formatDate(event.eventDate)}</span>
                            {event.eventDuration && (
                              <span className="text-xs text-muted-foreground">
                                {event.eventDuration} menit
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {event.price === 0 ? "GRATIS" : formatCurrency(event.price)}
                            </span>
                            {event.originalPrice && event.originalPrice > event.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(event.originalPrice)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {attendeeCount}
                              {hasCapacity && `/\${event.maxParticipants}`}
                            </span>
                            {isFull && (
                              <Badge variant="destructive" className="text-xs w-fit">
                                Penuh
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.text}
                            </Badge>
                            {!event.isActive && (
                              <Badge variant="outline" className="text-xs">
                                Non-aktif
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getVisibilityLabel(event.eventVisibility)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/events/${event.slug}`, "_blank")}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Halaman
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/checkout/product/${event.checkoutSlug || event.slug}`, "_blank")}
                              >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Lihat Checkout
                              </DropdownMenuItem>
                              {event.eventUrl && (
                                <DropdownMenuItem
                                  onClick={() => window.open(event.eventUrl!, "_blank")}
                                >
                                  <Video className="mr-2 h-4 w-4" />
                                  Buka Link Meeting
                                </DropdownMenuItem>
                              )}
                              {event.salesPageUrl && (
                                <DropdownMenuItem
                                  onClick={() => window.open(event.salesPageUrl!, "_blank")}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Sales Page
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/events/${event.id}/form`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Atur Form
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    eventId: event.id,
                                    eventName: event.name,
                                  })
                                }
                                disabled={attendeeCount > 0}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, eventId: null, eventName: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Event</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus event <strong>{deleteDialog.eventName}</strong>?
              <br />
              <br />
              <span className="text-red-600">
                Tindakan ini tidak dapat dibatalkan. Event dengan peserta tidak dapat dihapus.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </ResponsivePageWrapper>
  );
}
