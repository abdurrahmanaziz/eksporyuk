# 🔴 PRIORITY 1: HIGH PRIORITY FEATURES - IMPLEMENTATION PLAN

**Tanggal:** 1 Desember 2025  
**Status:** Ready to Implement  
**Estimasi Total:** 5-7 hari kerja

---

## 📋 OVERVIEW PRIORITY 1

Berdasarkan audit lengkap, ada **2 fitur utama** yang masuk Priority 1:

### 1️⃣ **Banner & Ads System** (Estimasi: 2-3 hari)
### 2️⃣ **Export Document Generator** (Estimasi: 3-4 hari)

---

## 🎯 FITUR 1: BANNER & ADS SYSTEM

### 📌 **Latar Belakang**
PRD lengkap sudah tersedia di `prd.md`. Fitur ini penting untuk:
- Promosi internal (membership, courses, events)
- Monetisasi eksternal (banner sponsor)
- Engagement user (pengumuman, promo)
- Affiliate promotion

### 🗄️ **Database Schema Baru**

```prisma
// Model Banner
model Banner {
  id              String          @id @default(cuid())
  title           String
  description     String?
  imageUrl        String?
  videoUrl        String?
  linkUrl         String
  linkText        String?         @default("Lihat Selengkapnya")
  
  // Targeting
  targetRole      Json            // Array of roles: ["MEMBER_FREE", "MEMBER_PREMIUM", "AFFILIATE"]
  targetMembership Json?          // Specific membership IDs
  placement       BannerPlacement @default(DASHBOARD)
  
  // Display settings
  displayType     BannerType      @default(CAROUSEL)
  backgroundColor String?         @default("#3B82F6")
  textColor       String?         @default("#FFFFFF")
  priority        Int             @default(0)
  
  // Scheduling
  startDate       DateTime
  endDate         DateTime
  isActive        Boolean         @default(true)
  
  // Limits
  viewLimit       Int?            // Max views per user
  clickLimit      Int?            // Max clicks per user
  dailyBudget     Int?            // For paid banners
  
  // Creator
  createdBy       String
  isSponsored     Boolean         @default(false)
  sponsorName     String?
  
  // Metrics
  totalViews      Int             @default(0)
  totalClicks     Int             @default(0)
  totalBudgetUsed Decimal         @default(0)
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  views           BannerView[]
  clicks          BannerClick[]
  
  @@index([placement])
  @@index([isActive])
  @@index([startDate, endDate])
  @@index([priority])
}

// Track views
model BannerView {
  id        String   @id @default(cuid())
  bannerId  String
  userId    String?  // Null if guest
  ipAddress String?
  userAgent String?
  viewedAt  DateTime @default(now())
  
  banner    Banner   @relation(fields: [bannerId], references: [id], onDelete: Cascade)
  
  @@index([bannerId])
  @@index([userId])
  @@index([viewedAt])
}

// Track clicks
model BannerClick {
  id        String   @id @default(cuid())
  bannerId  String
  userId    String?
  ipAddress String?
  userAgent String?
  clickedAt DateTime @default(now())
  
  banner    Banner   @relation(fields: [bannerId], references: [id], onDelete: Cascade)
  
  @@index([bannerId])
  @@index([userId])
  @@index([clickedAt])
}

enum BannerPlacement {
  DASHBOARD      // Carousel utama di dashboard
  FEED           // Inline di feed komunitas
  GROUP          // Banner horizontal di grup
  PROFILE        // Card di profile
  SIDEBAR        // Sidebar kanan
  POPUP          // Popup modal
  FLOATING       // Floating button kanan bawah
}

enum BannerType {
  CAROUSEL       // Auto-slide carousel
  STATIC         // Fixed banner
  VIDEO          // Video banner
  POPUP          // Modal popup
  FLOATING       // Sticky floating
}
```

### 🎨 **UI Components yang Perlu Dibuat**

#### 1. **Admin Panel** (`/admin/banners`)

```tsx
// Components structure:
src/app/(dashboard)/admin/banners/
├── page.tsx                    // List all banners
├── create/page.tsx             // Create new banner
├── [id]/edit/page.tsx          // Edit banner
└── [id]/analytics/page.tsx     // Banner analytics

src/components/admin/banners/
├── BannerList.tsx              // Table with actions
├── BannerForm.tsx              // Create/Edit form
├── BannerPreview.tsx           // Live preview
├── BannerAnalytics.tsx         // Charts & metrics
└── BannerScheduler.tsx         // Schedule settings
```

**Features Admin Panel:**
- ✅ CRUD banners
- ✅ Image/video upload
- ✅ Rich text editor untuk description
- ✅ Target selector (role, membership, location)
- ✅ Placement selector dengan preview
- ✅ Schedule start/end date dengan timezone
- ✅ Priority sorting (drag & drop)
- ✅ Analytics dashboard per banner
- ✅ Export report (Excel/CSV)

#### 2. **User Display Components**

```tsx
src/components/banners/
├── BannerCarousel.tsx          // Dashboard carousel
├── InlineBanner.tsx            // Feed inline banner
├── SidebarBanner.tsx           // Sidebar banner
├── PopupBanner.tsx             // Modal popup
├── FloatingBanner.tsx          // Floating button
└── BannerTracker.tsx           // View/click tracker (invisible)
```

### 🔌 **API Routes**

```typescript
// Admin APIs
src/app/api/admin/banners/
├── route.ts                    // GET (list), POST (create)
├── [id]/route.ts               // GET, PUT, DELETE
├── [id]/analytics/route.ts     // GET analytics
└── upload/route.ts             // Upload image/video

// Public APIs
src/app/api/banners/
├── active/route.ts             // GET active banners by placement
├── [id]/view/route.ts          // POST track view
└── [id]/click/route.ts         // POST track click
```

### 📊 **Analytics Dashboard Features**

```typescript
interface BannerAnalytics {
  bannerId: string
  title: string
  
  // Overall metrics
  totalViews: number
  totalClicks: number
  ctr: number              // Click-through rate
  avgViewDuration: number  // Average time viewed
  
  // Engagement by time
  viewsByDay: { date: string; views: number; clicks: number }[]
  viewsByHour: { hour: number; views: number }[]
  
  // Demographics
  viewsByRole: { role: string; count: number }[]
  viewsByMembership: { membership: string; count: number }[]
  viewsByDevice: { device: string; count: number }[]
  
  // Geography (if available)
  viewsByRegion: { region: string; count: number }[]
  
  // Performance
  conversionRate: number   // If banner links to checkout
  revenue: number          // If tracking affiliate/sales
}
```

### 🎯 **Smart Targeting Logic**

```typescript
// Algoritma untuk menampilkan banner yang tepat
function getActiveBanners(params: {
  userId?: string
  userRole?: Role
  membership?: string
  placement: BannerPlacement
  province?: string
}) {
  // 1. Filter by placement
  // 2. Filter by active dates
  // 3. Filter by target role/membership
  // 4. Filter by view limit per user
  // 5. Sort by priority
  // 6. Return top banners
}
```

### 💡 **Saran Implementasi Banner System**

**REKOMENDASI SAYA:**

#### **Phase 1: MVP (2 hari) - IMPLEMENT DULU INI**
1. ✅ **Database schema** + migration
2. ✅ **Admin CRUD** basic (tanpa analytics)
3. ✅ **Dashboard carousel** component
4. ✅ **Inline feed banner** component
5. ✅ **View/click tracking** API

**Output Phase 1:**
- Admin bisa buat banner
- Banner muncul di dashboard carousel
- Banner muncul di feed (setiap 5 post)
- Tracking views & clicks berjalan

#### **Phase 2: Advanced (1 hari) - OPSIONAL**
1. ✅ **Analytics dashboard** lengkap
2. ✅ **Smart targeting** by role/membership
3. ✅ **Schedule system** dengan timezone
4. ✅ **Popup & floating** banners
5. ✅ **A/B testing** (split banner)

---

## 📄 FITUR 2: EXPORT DOCUMENT GENERATOR

### 📌 **Latar Belakang**
Model database sudah ada (`ExportDocument`, `GeneratedDocument`), tapi belum ada:
- UI form builder
- PDF generation
- Auto-fill system

### 🗄️ **Database Schema (SUDAH ADA)**

```prisma
model ExportDocument {
  id             String              @id @default(cuid())
  name           String              // "Commercial Invoice"
  type           String              // "invoice", "packing_list", "coo"
  description    String?
  templateHtml   String              // HTML template with {{variables}}
  templateFields Json                // Field definitions
  isActive       Boolean             @default(true)
  isPremium      Boolean             @default(false)
  createdBy      String
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  generated      GeneratedDocument[]
}

model GeneratedDocument {
  id           String         @id @default(cuid())
  userId       String
  templateId   String
  documentData Json           // Filled data
  documentHtml String         // Rendered HTML
  documentPdf  String?        // PDF file URL
  title        String
  notes        String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  template     ExportDocument @relation(fields: [templateId], references: [id])
  user         User           @relation(fields: [userId], references: [id])
}
```

### 🎨 **UI Components yang Perlu Dibuat**

#### 1. **Admin Panel** (`/admin/documents`)

```tsx
src/app/(dashboard)/admin/documents/
├── page.tsx                       // List templates
├── create/page.tsx                // Create template
├── [id]/edit/page.tsx             // Edit template
└── [id]/preview/page.tsx          // Preview template

src/components/admin/documents/
├── DocumentTemplateList.tsx       // List with filters
├── DocumentTemplateForm.tsx       // Form builder
├── TemplateFieldBuilder.tsx       // Drag-drop field builder
├── TemplateHTMLEditor.tsx         // HTML editor with syntax highlight
└── TemplatePreview.tsx            // Live preview
```

**Features Admin Panel:**
- ✅ Template management (CRUD)
- ✅ Field builder (drag & drop)
- ✅ HTML editor dengan variable support
- ✅ Preview dengan sample data
- ✅ Template categories
- ✅ Premium/Free toggle

#### 2. **User Document Generator** (`/documents`)

```tsx
src/app/(dashboard)/documents/
├── page.tsx                       // List available templates
├── [templateId]/generate/page.tsx // Fill form & generate
├── history/page.tsx               // User's generated docs
└── [docId]/view/page.tsx          // View/download generated doc

src/components/documents/
├── DocumentTemplateCard.tsx       // Template preview card
├── DocumentForm.tsx               // Dynamic form based on fields
├── DocumentPreview.tsx            // Live preview while typing
├── DocumentDownload.tsx           // Download buttons (PDF, DOCX)
└── DocumentHistory.tsx            // List user's documents
```

### 📝 **Template Examples**

#### **1. Commercial Invoice Template**

```json
{
  "fields": [
    {
      "id": "invoice_number",
      "label": "Invoice Number",
      "type": "text",
      "required": true,
      "placeholder": "INV-2025-001"
    },
    {
      "id": "invoice_date",
      "label": "Invoice Date",
      "type": "date",
      "required": true
    },
    {
      "id": "exporter_name",
      "label": "Exporter Name",
      "type": "text",
      "required": true,
      "autofill": "user.name"
    },
    {
      "id": "exporter_address",
      "label": "Exporter Address",
      "type": "textarea",
      "required": true,
      "autofill": "user.address"
    },
    {
      "id": "buyer_name",
      "label": "Buyer Name",
      "type": "text",
      "required": true
    },
    {
      "id": "buyer_country",
      "label": "Buyer Country",
      "type": "select",
      "options": ["countries_list"],
      "required": true
    },
    {
      "id": "items",
      "label": "Items",
      "type": "table",
      "columns": [
        { "key": "description", "label": "Description" },
        { "key": "quantity", "label": "Quantity" },
        { "key": "unit_price", "label": "Unit Price" },
        { "key": "total", "label": "Total", "calculated": true }
      ],
      "required": true
    },
    {
      "id": "subtotal",
      "label": "Subtotal",
      "type": "number",
      "calculated": true,
      "formula": "sum(items.total)"
    },
    {
      "id": "shipping",
      "label": "Shipping Cost",
      "type": "number"
    },
    {
      "id": "grand_total",
      "label": "Grand Total",
      "type": "number",
      "calculated": true,
      "formula": "subtotal + shipping"
    }
  ]
}
```

#### **2. Packing List Template**

```json
{
  "fields": [
    {
      "id": "packing_number",
      "label": "Packing List Number",
      "type": "text",
      "required": true
    },
    {
      "id": "invoice_ref",
      "label": "Invoice Reference",
      "type": "text",
      "required": true
    },
    {
      "id": "shipping_marks",
      "label": "Shipping Marks",
      "type": "textarea"
    },
    {
      "id": "packages",
      "label": "Package Details",
      "type": "table",
      "columns": [
        { "key": "package_no", "label": "Package No." },
        { "key": "description", "label": "Description" },
        { "key": "quantity", "label": "Quantity" },
        { "key": "weight", "label": "Net Weight (kg)" },
        { "key": "gross_weight", "label": "Gross Weight (kg)" },
        { "key": "dimensions", "label": "Dimensions (cm)" }
      ]
    },
    {
      "id": "total_packages",
      "label": "Total Packages",
      "type": "number",
      "calculated": true
    },
    {
      "id": "total_weight",
      "label": "Total Net Weight",
      "type": "number",
      "calculated": true
    }
  ]
}
```

#### **3. Certificate of Origin (COO)**

```json
{
  "fields": [
    {
      "id": "coo_number",
      "label": "COO Number",
      "type": "text",
      "required": true
    },
    {
      "id": "exporter_info",
      "label": "Exporter Information",
      "type": "group",
      "fields": [
        { "id": "name", "label": "Name", "type": "text", "autofill": "user.companyName" },
        { "id": "address", "label": "Address", "type": "textarea", "autofill": "user.address" },
        { "id": "country", "label": "Country", "type": "text", "default": "Indonesia" }
      ]
    },
    {
      "id": "consignee_info",
      "label": "Consignee Information",
      "type": "group",
      "fields": [
        { "id": "name", "label": "Name", "type": "text" },
        { "id": "address", "label": "Address", "type": "textarea" },
        { "id": "country", "label": "Country", "type": "select" }
      ]
    },
    {
      "id": "goods_description",
      "label": "Description of Goods",
      "type": "textarea",
      "required": true
    },
    {
      "id": "hs_code",
      "label": "HS Code",
      "type": "text"
    },
    {
      "id": "origin_criteria",
      "label": "Origin Criteria",
      "type": "select",
      "options": [
        "Wholly obtained",
        "Produced entirely from originating materials",
        "Substantial transformation"
      ]
    }
  ]
}
```

### 🔌 **API Routes**

```typescript
// Admin APIs
src/app/api/admin/documents/
├── templates/route.ts              // GET (list), POST (create)
├── templates/[id]/route.ts         // GET, PUT, DELETE
└── templates/[id]/preview/route.ts // POST preview with sample data

// User APIs
src/app/api/documents/
├── templates/route.ts              // GET available templates
├── templates/[id]/route.ts         // GET template details
├── generate/route.ts               // POST generate document
├── [docId]/route.ts                // GET document
├── [docId]/pdf/route.ts            // GET download PDF
└── history/route.ts                // GET user's documents
```

### 🖨️ **PDF Generation**

**Rekomendasi Library:**

```bash
npm install @react-pdf/renderer
# atau
npm install puppeteer
# atau
npm install jspdf html2canvas
```

**Implementasi dengan Puppeteer (RECOMMENDED):**

```typescript
import puppeteer from 'puppeteer'

async function generatePDF(html: string, options?: PuppeteerPDFOptions) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  await page.setContent(html, { waitUntil: 'networkidle0' })
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    ...options
  })
  
  await browser.close()
  return pdf
}
```

### 💡 **Saran Implementasi Document Generator**

**REKOMENDASI SAYA:**

#### **Phase 1: MVP (2 hari) - IMPLEMENT DULU INI**
1. ✅ **Admin template manager** (CRUD basic)
2. ✅ **3 template dasar** (Invoice, Packing List, COO)
3. ✅ **User form generator** (dynamic form)
4. ✅ **PDF generation** basic (Puppeteer)
5. ✅ **Download & preview** PDF

**Output Phase 1:**
- Admin bisa buat template baru
- 3 template ready to use
- User bisa isi form & generate PDF
- Download PDF berjalan

#### **Phase 2: Advanced (1-2 hari) - OPSIONAL**
1. ✅ **Field builder** (drag & drop)
2. ✅ **Auto-fill** dari user profile
3. ✅ **Calculated fields** (formulas)
4. ✅ **Document history** & re-generate
5. ✅ **Export DOCX** (selain PDF)
6. ✅ **Template marketplace** (share templates)

---

## 🎯 SARAN IMPLEMENTASI KESELURUHAN

### **STRATEGI PENGERJAAN (RECOMMENDED)**

#### **Minggu 1: Day 1-3 (Banner System MVP)**
```
Day 1:
- Setup database schema
- Admin CRUD banner (basic)
- Upload image functionality

Day 2:
- Dashboard carousel component
- Inline feed banner component
- View tracking API

Day 3:
- Click tracking API
- Basic analytics
- Testing & refinement
```

#### **Minggu 1: Day 4-7 (Document Generator MVP)**
```
Day 4:
- Admin template manager
- Template Commercial Invoice

Day 5:
- Template Packing List
- Template COO
- Dynamic form generator

Day 6:
- PDF generation dengan Puppeteer
- Download functionality
- Preview modal

Day 7:
- Document history page
- Testing seluruh flow
- Bug fixes
```

### **PRIORITAS FITUR DALAM BANNER SYSTEM**

**MUST HAVE (Phase 1):**
1. ✅ Dashboard carousel banner (homepage)
2. ✅ Feed inline banner (setiap 5 posts)
3. ✅ Admin CRUD interface
4. ✅ Image upload
5. ✅ Target by role (Admin, Member, Affiliate)
6. ✅ Schedule start/end date
7. ✅ View & click tracking

**NICE TO HAVE (Phase 2):**
1. 🔄 Video banner support
2. 🔄 Popup banner
3. 🔄 Floating banner
4. 🔄 Analytics dashboard lengkap
5. 🔄 A/B testing
6. 🔄 Sponsor banner (paid)
7. 🔄 Smart targeting by province/membership

### **PRIORITAS FITUR DALAM DOCUMENT GENERATOR**

**MUST HAVE (Phase 1):**
1. ✅ Commercial Invoice template
2. ✅ Packing List template
3. ✅ Certificate of Origin template
4. ✅ Dynamic form generator
5. ✅ PDF generation
6. ✅ Download PDF
7. ✅ Document history

**NICE TO HAVE (Phase 2):**
1. 🔄 Field builder (drag & drop)
2. 🔄 Auto-fill dari profile
3. 🔄 Calculated fields
4. 🔄 Multi-currency support
5. 🔄 Multiple languages
6. 🔄 Export DOCX
7. 🔄 Template sharing
8. 🔄 Digital signature

---

## 💰 ESTIMASI DAMPAK BISNIS

### **Banner System:**
- ✅ Engagement +30% (dengan banner promo)
- ✅ Conversion +15% (banner membership upgrade)
- ✅ Revenue potensial: Rp 5-10 juta/bulan (sponsor banner)

### **Document Generator:**
- ✅ Retention +40% (fitur premium yang berguna)
- ✅ Membership upgrade +25% (user butuh dokumen)
- ✅ Differentiator kuat vs kompetitor

---

## ✅ CHECKLIST IMPLEMENTATION

### **Banner System:**
- [ ] Database migration (Banner, BannerView, BannerClick)
- [ ] Admin page: `/admin/banners`
- [ ] Admin CRUD API
- [ ] Image upload API
- [ ] Banner carousel component
- [ ] Inline banner component
- [ ] View tracker API
- [ ] Click tracker API
- [ ] Basic analytics

### **Document Generator:**
- [ ] Admin page: `/admin/documents`
- [ ] Template CRUD API
- [ ] 3 base templates (JSON)
- [ ] User page: `/documents`
- [ ] Dynamic form generator
- [ ] PDF generation service
- [ ] Download API
- [ ] Document history page

---

## 🚀 KESIMPULAN

**Total estimasi: 5-7 hari kerja**

**Dengan 2 fitur ini selesai:**
- ✅ Platform completion: **95% → 98%**
- ✅ Competitive advantage: **Sangat tinggi**
- ✅ User retention: **Meningkat signifikan**
- ✅ Revenue potential: **+30-40%**

**Sistem siap production dengan value proposition yang kuat!**

---

**Prepared by:** GitHub Copilot  
**Date:** 1 Desember 2025  
**Version:** 1.0
