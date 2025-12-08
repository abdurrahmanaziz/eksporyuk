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
import { Package, Calendar, FileText, BookOpen, Plus, MoreHorizontal, Pencil, Trash2, Eye, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  productType: "DIGITAL" | "COURSE_BUNDLE" | "EBOOK" | "TEMPLATE";
  isActive: boolean;
  userProducts: { id: string }[];
  _count?: {
    userProducts: number;
  };
}

interface StatsData {
  totalProducts: number;
  totalSold: number;
  totalRevenue: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalProducts: 0,
    totalSold: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    productId: string | null;
    productName: string;
  }>({
    open: false,
    productId: null,
    productName: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, typeFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      
      setProducts(data.products || []);
      calculateStats(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData: Product[]) => {
    const totalProducts = productsData.length;
    const totalSold = productsData.reduce(
      (sum, p) => sum + (p._count?.userProducts || p.userProducts?.length || 0),
      0
    );
    const totalRevenue = productsData.reduce((sum, p) => {
      const sold = p._count?.userProducts || p.userProducts?.length || 0;
      return sum + sold * p.price;
    }, 0);

    setStats({
      totalProducts,
      totalSold,
      totalRevenue,
    });
  };

  const filterProducts = () => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((p) => p.productType === typeFilter);
    }

    // Status filter
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((p) => !p.isActive);
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDialog.productId) return;

    try {
      const response = await fetch(`/api/admin/products/${deleteDialog.productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Produk berhasil dihapus");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Gagal menghapus produk");
    } finally {
      setDeleteDialog({ open: false, productId: null, productName: "" });
    }
  };

  const getProductTypeLabel = (type: string) => {
    const types: Record<string, { label: string; icon: any; color: string }> = {
      DIGITAL: { label: "Digital", icon: Package, color: "bg-blue-500" },
      EVENT: { label: "Event", icon: Calendar, color: "bg-purple-500" },
      COURSE_BUNDLE: { label: "Bundle Kelas", icon: BookOpen, color: "bg-green-500" },
      EBOOK: { label: "Ebook", icon: FileText, color: "bg-amber-500" },
      TEMPLATE: { label: "Template", icon: FileText, color: "bg-pink-500" },
    };
    return types[type] || { label: type, icon: Package, color: "bg-gray-500" };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk digital, ebook, template, dan bundle kelas
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Semua produk aktif & non-aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terjual</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSold}</div>
            <p className="text-xs text-muted-foreground">Total penjualan produk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total pendapatan produk</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>Cari dan filter produk sesuai kebutuhan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau slug produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipe Produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="DIGITAL">Digital</SelectItem>
                <SelectItem value="COURSE_BUNDLE">Bundle Kelas</SelectItem>
                <SelectItem value="EBOOK">Ebook</SelectItem>
                <SelectItem value="TEMPLATE">Template</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Non-aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat produk...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada produk. Klik tombol "Tambah Produk" untuk membuat produk baru.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Terjual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const typeInfo = getProductTypeLabel(product.productType);
                    const Icon = typeInfo.icon;
                    const soldCount = product._count?.userProducts || product.userProducts?.length || 0;
                    const isUpcomingEvent =
                      product.productType === "EVENT" &&
                      product.eventDate &&
                      new Date(product.eventDate) > new Date();

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">{product.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{soldCount}x</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Aktif" : "Non-aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.productType === "EVENT" && product.eventDate ? (
                            <div className="flex flex-col text-xs">
                              <span>
                                {new Date(product.eventDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {isUpcomingEvent && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Mendatang
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/products/${product.slug}`, "_blank")}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    productId: product.id,
                                    productName: product.name,
                                  })
                                }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, productId: null, productName: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk <strong>{deleteDialog.productName}</strong>?
              <br />
              <br />
              <span className="text-red-600">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait produk ini akan ikut terhapus.
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
