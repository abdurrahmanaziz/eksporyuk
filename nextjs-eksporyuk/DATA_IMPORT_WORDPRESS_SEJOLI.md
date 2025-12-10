# Data Import System - WordPress & Sejoli → Eksporyuk

## 🎯 Konsep: Centralized Data Management

**Semua data dari WordPress & Sejoli akan di-import ke website Eksporyuk terbaru untuk:**
- ✅ **Single source of truth** - Semua data di satu tempat
- ✅ **Unified reporting** - Revenue, komisi, user activity dalam 1 dashboard
- ✅ **Better analytics** - Track semua transaksi & behavior
- ✅ **Konsisten data** - Tidak ada duplikasi atau konflik
- ✅ **Easy maintenance** - Manage di 1 sistem saja

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES (External)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐           ┌─────────────────┐            │
│  │   WORDPRESS     │           │     SEJOLI      │            │
│  │  (Tutor LMS)    │           │  (Membership)   │            │
│  ├─────────────────┤           ├─────────────────┤            │
│  │ • Courses       │           │ • Orders        │            │
│  │ • Lessons       │           │ • Transactions  │            │
│  │ • Students      │           │ • Members       │            │
│  │ • Progress      │           │ • Affiliates    │            │
│  │ • Certificates  │           │ • Commissions   │            │
│  └────────┬────────┘           └────────┬────────┘            │
│           │                             │                     │
│           │    ┌────────────────────┐   │                     │
│           └───→│  IMPORT PROCESS    │←──┘                     │
│                │  (Migration Jobs)  │                         │
│                └─────────┬──────────┘                         │
│                          ↓                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│              EKSPORYUK WEB TERBARU (Main System)                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    DATABASE (Prisma)                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │   USERS     │  │  COURSES    │  │ MEMBERSHIPS │    │  │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤    │  │
│  │  │ WP + Sejoli │  │ From WP     │  │ From Sejoli │    │  │
│  │  │ Merged      │  │ Imported    │  │ Imported    │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │TRANSACTIONS │  │ AFFILIATES  │  │  PROGRESS   │    │  │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤    │  │
│  │  │ From Sejoli │  │ From Sejoli │  │ From WP     │    │  │
│  │  │ Imported    │  │ Mapped      │  │ Imported    │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FEATURES                              │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • Unified Dashboard                                      │  │
│  │ • Single Login System                                    │  │
│  │ • Centralized Revenue Tracking                           │  │
│  │ • Unified Affiliate System                               │  │
│  │ • Complete Analytics                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ WordPress (Tutor LMS) Import

### A. Data yang Di-import

#### 1. **Users (Students & Instructors)**
```typescript
// WordPress User → Eksporyuk User
{
  wpUserId: "123",
  email: "student@example.com",
  name: "John Doe",
  role: "MEMBER_FREE", // atau MEMBER_PREMIUM jika ada membership aktif
  createdAt: wpUser.registered_date,
  
  // Metadata dari WP
  metadata: {
    source: "WORDPRESS",
    wpUserId: "123",
    wpUsername: "johndoe",
    wpDisplayName: "John Doe",
  }
}
```

#### 2. **Courses**
```typescript
// WP Course → Eksporyuk Course
{
  wpCourseId: "456",
  title: "Ekspor Untuk Pemula",
  slug: "ekspor-untuk-pemula",
  description: wpCourse.content,
  thumbnail: wpCourse.featured_image,
  price: wpCourse.price,
  status: "PUBLISHED",
  
  // Metadata
  metadata: {
    source: "WORDPRESS",
    wpCourseId: "456",
    wpAuthorId: "1",
    originalUrl: "https://old-site.com/course/...",
  }
}
```

#### 3. **Lessons & Modules**
```typescript
// WP Lesson → Eksporyuk Lesson
{
  wpLessonId: "789",
  title: "Intro to Export",
  content: wpLesson.content,
  videoUrl: wpLesson.video_url,
  duration: wpLesson.duration,
  order: wpLesson.menu_order,
  
  courseId: mappedCourseId,
  moduleId: mappedModuleId,
}
```

#### 4. **Enrollments & Progress**
```typescript
// WP Enrollment → Eksporyuk CourseEnrollment
{
  userId: mappedUserId,
  courseId: mappedCourseId,
  enrolledAt: wpEnrollment.date,
  progress: wpEnrollment.completed_lessons / wpEnrollment.total_lessons * 100,
  status: wpEnrollment.status, // "in-progress", "completed"
  
  metadata: {
    source: "WORDPRESS",
    wpEnrollmentId: "999",
  }
}
```

#### 5. **Certificates**
```typescript
// WP Certificate → Eksporyuk Certificate
{
  userId: mappedUserId,
  courseId: mappedCourseId,
  certificateNumber: generateNumber(),
  issuedAt: wpCert.completed_date,
  
  metadata: {
    source: "WORDPRESS",
    wpCertId: "111",
    wpCertUrl: "https://old-site.com/cert/...",
  }
}
```

### B. Import Script WordPress

```typescript
// /scripts/import-from-wordpress.ts

import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface WordPressImportConfig {
  wpApiUrl: string
  wpUsername: string
  wpAppPassword: string
}

export class WordPressImporter {
  constructor(private config: WordPressImportConfig) {}
  
  async importAll() {
    console.log('[WP IMPORT] Starting full import...')
    
    try {
      // 1. Import Users
      await this.importUsers()
      
      // 2. Import Courses
      await this.importCourses()
      
      // 3. Import Lessons
      await this.importLessons()
      
      // 4. Import Enrollments
      await this.importEnrollments()
      
      // 5. Import Progress
      await this.importProgress()
      
      // 6. Import Certificates
      await this.importCertificates()
      
      console.log('[WP IMPORT] ✅ All data imported successfully!')
      
    } catch (error) {
      console.error('[WP IMPORT] ❌ Error:', error)
      throw error
    }
  }
  
  async importUsers() {
    console.log('[WP IMPORT] Importing users...')
    
    // Get users from WP REST API
    const response = await axios.get(`${this.config.wpApiUrl}/wp-json/wp/v2/users`, {
      auth: {
        username: this.config.wpUsername,
        password: this.config.wpAppPassword,
      },
      params: {
        per_page: 100,
        page: 1,
      }
    })
    
    const wpUsers = response.data
    let imported = 0
    let skipped = 0
    
    for (const wpUser of wpUsers) {
      try {
        // Check if user already exists
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { email: wpUser.email },
              { 
                metadata: { 
                  path: ['wpUserId'], 
                  equals: wpUser.id.toString() 
                } 
              }
            ]
          }
        })
        
        if (existing) {
          console.log(`[WP IMPORT] User ${wpUser.email} already exists - SKIP`)
          skipped++
          continue
        }
        
        // Create user
        await prisma.user.create({
          data: {
            email: wpUser.email,
            name: wpUser.name,
            username: wpUser.slug,
            role: 'MEMBER_FREE',
            emailVerified: true,
            metadata: {
              source: 'WORDPRESS',
              wpUserId: wpUser.id.toString(),
              wpUsername: wpUser.slug,
              wpDisplayName: wpUser.name,
              importedAt: new Date().toISOString(),
            }
          }
        })
        
        imported++
        console.log(`[WP IMPORT] ✅ User ${wpUser.email} imported`)
        
      } catch (error) {
        console.error(`[WP IMPORT] ❌ Error importing user ${wpUser.email}:`, error)
      }
    }
    
    console.log(`[WP IMPORT] Users: ${imported} imported, ${skipped} skipped`)
  }
  
  async importCourses() {
    console.log('[WP IMPORT] Importing courses...')
    
    // Get courses from Tutor LMS API
    const response = await axios.get(`${this.config.wpApiUrl}/wp-json/tutor/v1/courses`, {
      auth: {
        username: this.config.wpUsername,
        password: this.config.wpAppPassword,
      }
    })
    
    const wpCourses = response.data
    let imported = 0
    
    for (const wpCourse of wpCourses) {
      try {
        // Check if course exists
        const existing = await prisma.course.findFirst({
          where: {
            metadata: {
              path: ['wpCourseId'],
              equals: wpCourse.id.toString()
            }
          }
        })
        
        if (existing) {
          console.log(`[WP IMPORT] Course ${wpCourse.title.rendered} exists - UPDATE`)
          
          await prisma.course.update({
            where: { id: existing.id },
            data: {
              title: wpCourse.title.rendered,
              description: wpCourse.content?.rendered,
              thumbnail: wpCourse.featured_media_url,
              updatedAt: new Date(),
            }
          })
          
        } else {
          // Create course
          await prisma.course.create({
            data: {
              title: wpCourse.title.rendered,
              slug: wpCourse.slug,
              description: wpCourse.content?.rendered || '',
              thumbnail: wpCourse.featured_media_url,
              price: parseFloat(wpCourse.price || '0'),
              status: 'PUBLISHED',
              level: 'BEGINNER',
              metadata: {
                source: 'WORDPRESS',
                wpCourseId: wpCourse.id.toString(),
                wpAuthorId: wpCourse.author.toString(),
                originalUrl: wpCourse.link,
                importedAt: new Date().toISOString(),
              }
            }
          })
          
          imported++
          console.log(`[WP IMPORT] ✅ Course ${wpCourse.title.rendered} imported`)
        }
        
      } catch (error) {
        console.error(`[WP IMPORT] ❌ Error importing course:`, error)
      }
    }
    
    console.log(`[WP IMPORT] Courses: ${imported} imported`)
  }
  
  // ... more import methods
}

// Usage
async function main() {
  const importer = new WordPressImporter({
    wpApiUrl: process.env.WP_API_URL!,
    wpUsername: process.env.WP_USERNAME!,
    wpAppPassword: process.env.WP_APP_PASSWORD!,
  })
  
  await importer.importAll()
}

main()
```

---

## 2️⃣ Sejoli (Membership & Orders) Import

### A. Data yang Di-import

#### 1. **Orders & Transactions**
```typescript
// Sejoli Order → Eksporyuk Transaction
{
  sejoliOrderId: "SJ-20251209-001",
  userId: mappedUserId,
  type: "MEMBERSHIP",
  status: "COMPLETED",
  amount: 500000,
  
  customerName: sejoliOrder.buyer_name,
  customerEmail: sejoliOrder.buyer_email,
  customerPhone: sejoliOrder.buyer_phone,
  
  paymentMethod: "SEJOLI",
  paymentProvider: "SEJOLI",
  externalId: sejoliOrder.order_id,
  paidAt: sejoliOrder.paid_date,
  
  metadata: {
    source: "SEJOLI",
    sejoliOrderId: sejoliOrder.order_id,
    sejoliProductId: sejoliOrder.product_id,
  }
}
```

#### 2. **Memberships**
```typescript
// Sejoli Order → Eksporyuk UserMembership
{
  userId: mappedUserId,
  membershipId: mappedMembershipId,
  
  startDate: sejoliOrder.order_date,
  endDate: sejoliOrder.expiry_date,
  
  isActive: sejoliOrder.status === 'active',
  status: mapSejoliStatus(sejoliOrder.status),
  activatedAt: sejoliOrder.activated_date,
  
  price: sejoliOrder.amount,
  transactionId: createdTransactionId,
  
  source: "SEJOLI",
  sejoliOrderId: sejoliOrder.order_id,
  sejoliProductId: sejoliOrder.product_id,
  
  externalData: sejoliOrder, // Full data
}
```

#### 3. **Affiliates & Commissions**
```typescript
// Sejoli Affiliate → Eksporyuk Affiliate
{
  sejoliAffiliateCode: "AFF123",
  userId: mappedUserId,
  
  affiliateProfile: {
    affiliateCode: "AFF123",
    tier: 1,
    commissionRate: sejoliAffiliate.default_rate,
    totalEarnings: sejoliAffiliate.total_earnings,
    isActive: true,
  },
  
  metadata: {
    source: "SEJOLI",
    sejoliAffiliateId: sejoliAffiliate.id,
  }
}

// Sejoli Commission → Eksporyuk AffiliateConversion
{
  affiliateId: mappedAffiliateId,
  transactionId: createdTransactionId,
  
  commissionAmount: sejoliCommission.amount,
  commissionRate: sejoliCommission.rate,
  
  paidOut: sejoliCommission.status === 'paid',
  paidOutAt: sejoliCommission.paid_date,
  
  sourceType: "SEJOLI",
  sejoliOrderId: sejoliCommission.order_id,
}
```

### B. Import Script Sejoli

```typescript
// /scripts/import-from-sejoli.ts

import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface SejoliImportConfig {
  sejoliApiUrl: string
  sejoliApiKey: string
}

export class SejoliImporter {
  constructor(private config: SejoliImportConfig) {}
  
  async importAll() {
    console.log('[SEJOLI IMPORT] Starting full import...')
    
    try {
      // 1. Import Orders & Transactions
      await this.importOrders()
      
      // 2. Import Memberships
      await this.importMemberships()
      
      // 3. Import Affiliates
      await this.importAffiliates()
      
      // 4. Import Commissions
      await this.importCommissions()
      
      console.log('[SEJOLI IMPORT] ✅ All data imported successfully!')
      
    } catch (error) {
      console.error('[SEJOLI IMPORT] ❌ Error:', error)
      throw error
    }
  }
  
  async importOrders() {
    console.log('[SEJOLI IMPORT] Importing orders...')
    
    // Get orders from Sejoli API
    const response = await axios.get(`${this.config.sejoliApiUrl}/orders`, {
      headers: {
        'Authorization': `Bearer ${this.config.sejoliApiKey}`,
      },
      params: {
        status: 'paid',
        per_page: 100,
      }
    })
    
    const sejoliOrders = response.data
    let imported = 0
    let skipped = 0
    
    for (const order of sejoliOrders) {
      try {
        // Check if order exists
        const existing = await prisma.transaction.findFirst({
          where: {
            OR: [
              { externalId: order.order_id },
              {
                metadata: {
                  path: ['sejoliOrderId'],
                  equals: order.order_id
                }
              }
            ]
          }
        })
        
        if (existing) {
          console.log(`[SEJOLI IMPORT] Order ${order.order_id} exists - SKIP`)
          skipped++
          continue
        }
        
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: order.buyer_email }
        })
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: order.buyer_email,
              name: order.buyer_name,
              phone: order.buyer_phone,
              whatsapp: order.buyer_whatsapp,
              role: 'MEMBER_PREMIUM',
              emailVerified: true,
              metadata: {
                source: 'SEJOLI',
                importedAt: new Date().toISOString(),
              }
            }
          })
        }
        
        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'MEMBERSHIP',
            status: 'COMPLETED',
            amount: order.amount,
            
            customerName: order.buyer_name,
            customerEmail: order.buyer_email,
            customerPhone: order.buyer_phone,
            customerWhatsapp: order.buyer_whatsapp,
            
            description: `Membership from Sejoli: ${order.product_name}`,
            paymentMethod: 'SEJOLI',
            paymentProvider: 'SEJOLI',
            externalId: order.order_id,
            paidAt: new Date(order.paid_date),
            
            metadata: {
              source: 'SEJOLI',
              sejoliOrderId: order.order_id,
              sejoliProductId: order.product_id,
              sejoliProductName: order.product_name,
              importedAt: new Date().toISOString(),
            }
          }
        })
        
        imported++
        console.log(`[SEJOLI IMPORT] ✅ Order ${order.order_id} imported`)
        
      } catch (error) {
        console.error(`[SEJOLI IMPORT] ❌ Error importing order ${order.order_id}:`, error)
      }
    }
    
    console.log(`[SEJOLI IMPORT] Orders: ${imported} imported, ${skipped} skipped`)
  }
  
  async importMemberships() {
    console.log('[SEJOLI IMPORT] Importing memberships...')
    
    // Get memberships from Sejoli
    const response = await axios.get(`${this.config.sejoliApiUrl}/memberships`, {
      headers: {
        'Authorization': `Bearer ${this.config.sejoliApiKey}`,
      }
    })
    
    const sejoliMemberships = response.data
    let imported = 0
    
    for (const sjMembership of sejoliMemberships) {
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { email: sjMembership.user_email }
        })
        
        if (!user) {
          console.log(`[SEJOLI IMPORT] User not found for ${sjMembership.user_email} - SKIP`)
          continue
        }
        
        // Find or create membership plan
        let membershipPlan = await prisma.membership.findFirst({
          where: {
            metadata: {
              path: ['sejoliProductId'],
              equals: sjMembership.product_id
            }
          }
        })
        
        if (!membershipPlan) {
          // Create membership plan from Sejoli product
          membershipPlan = await prisma.membership.create({
            data: {
              name: sjMembership.product_name,
              slug: sjMembership.product_slug || generateSlug(sjMembership.product_name),
              description: sjMembership.product_description || '',
              price: sjMembership.price,
              duration: sjMembership.duration_days || 90,
              durationType: 'DAYS',
              status: 'PUBLISHED',
              
              metadata: {
                source: 'SEJOLI',
                sejoliProductId: sjMembership.product_id,
              }
            }
          })
        }
        
        // Find transaction
        const transaction = await prisma.transaction.findFirst({
          where: {
            externalId: sjMembership.order_id,
          }
        })
        
        // Create UserMembership
        await prisma.userMembership.create({
          data: {
            userId: user.id,
            membershipId: membershipPlan.id,
            
            startDate: new Date(sjMembership.start_date),
            endDate: new Date(sjMembership.expiry_date),
            
            isActive: sjMembership.status === 'active',
            status: sjMembership.status === 'active' ? 'ACTIVE' : 'EXPIRED',
            activatedAt: new Date(sjMembership.activated_date),
            
            price: sjMembership.price,
            transactionId: transaction?.id,
            
            source: 'SEJOLI',
            sejoliOrderId: sjMembership.order_id,
            sejoliProductId: sjMembership.product_id,
            externalData: sjMembership,
          }
        })
        
        imported++
        console.log(`[SEJOLI IMPORT] ✅ Membership for ${user.email} imported`)
        
      } catch (error) {
        console.error(`[SEJOLI IMPORT] ❌ Error importing membership:`, error)
      }
    }
    
    console.log(`[SEJOLI IMPORT] Memberships: ${imported} imported`)
  }
  
  // ... more import methods
}
```

---

## 3️⃣ Unified System Architecture

### Database Schema untuk Import Tracking

```prisma
// Add to schema.prisma

model DataImportLog {
  id            String   @id @default(cuid())
  source        String   // "WORDPRESS" or "SEJOLI"
  importType    String   // "users", "courses", "orders", etc
  status        String   @default("PENDING") // PENDING, RUNNING, COMPLETED, FAILED
  totalRecords  Int      @default(0)
  importedCount Int      @default(0)
  skippedCount  Int      @default(0)
  errorCount    Int      @default(0)
  errors        Json?    // Array of errors
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([source])
  @@index([importType])
  @@index([status])
}

// Add fields to existing models for tracking source
model User {
  // ... existing fields
  
  // Import tracking
  importSource  String?   // "WORDPRESS", "SEJOLI", "INTERNAL"
  externalId    String?   // WP User ID or Sejoli User ID
  
  @@index([importSource])
  @@index([externalId])
}

model Course {
  // ... existing fields
  
  importSource  String?
  externalId    String?
  
  @@index([importSource])
  @@index([externalId])
}

model Transaction {
  // ... existing fields
  
  importSource  String?
  externalId    String?  @unique // Already exists!
  
  @@index([importSource])
}
```

---

## 4️⃣ Admin Dashboard - Import Management

### Page: `/admin/data-import`

**Features**:
```typescript
// Import Dashboard
- View import history
- Start new import (WP or Sejoli)
- Monitor import progress
- View import logs
- Retry failed imports
- Export import report
```

**UI Example**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Data Import Center</CardTitle>
    <CardDescription>
      Import data dari WordPress & Sejoli ke sistem terbaru
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="wordpress">
      <TabsList>
        <TabsTrigger value="wordpress">WordPress</TabsTrigger>
        <TabsTrigger value="sejoli">Sejoli</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="wordpress">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => startImport('WORDPRESS', 'users')}>
                  Import Users
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => startImport('WORDPRESS', 'courses')}>
                  Import Courses
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="sejoli">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => startImport('SEJOLI', 'orders')}>
                  Import Orders
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => startImport('SEJOLI', 'memberships')}>
                  Import Memberships
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="history">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant={log.source === 'WORDPRESS' ? 'blue' : 'purple'}>
                    {log.source}
                  </Badge>
                </TableCell>
                <TableCell>{log.importType}</TableCell>
                <TableCell>
                  <Badge variant={
                    log.status === 'COMPLETED' ? 'success' :
                    log.status === 'FAILED' ? 'destructive' : 'default'
                  }>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.importedCount} / {log.totalRecords}
                </TableCell>
                <TableCell>{formatDate(log.startedAt)}</TableCell>
                <TableCell>{formatDuration(log.completedAt - log.startedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

---

## 5️⃣ Benefits - Centralized System

### ✅ Single Source of Truth
```
Before (Fragmented):
├─ WordPress (Courses & Progress)
├─ Sejoli (Orders & Memberships)
└─ ❌ Data tidak sinkron, duplikasi, konflik

After (Centralized):
└─ Eksporyuk (ALL Data)
    ├─ Users (merged dari WP + Sejoli)
    ├─ Courses (dari WP)
    ├─ Memberships (dari Sejoli)
    ├─ Transactions (dari Sejoli)
    ├─ Progress (dari WP)
    └─ ✅ Semua data di 1 tempat
```

### ✅ Unified Reporting
```typescript
// Report: Total Revenue
const totalRevenue = await prisma.transaction.aggregate({
  _sum: { amount: true },
  where: {
    status: 'COMPLETED',
    // Include SEMUA transaksi (dari Sejoli + internal)
  }
})
```

### ✅ Better Analytics
```typescript
// Analytics: User Lifecycle
const userJourney = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    courseEnrollments: true,      // From WP
    userMemberships: true,         // From Sejoli
    transactions: true,            // From Sejoli
    affiliateProfile: {            // From Sejoli
      include: {
        conversions: true,
      }
    }
  }
})

// Semua data user dalam 1 query!
```

### ✅ Consistent UX
```
User Login → 1 System
├─ View courses (dari WP)
├─ View membership status (dari Sejoli)
├─ View transactions (dari Sejoli)
└─ Manage profile (centralized)
```

---

## 6️⃣ Migration Strategy

### Phase 1: Initial Import (One-time)
```bash
# 1. Import historical data
npm run import:wordpress
npm run import:sejoli

# 2. Verify data
npm run verify:import

# 3. Test sistem dengan imported data
npm run test:e2e
```

### Phase 2: Real-time Sync (Ongoing)
```typescript
// WordPress: Webhook on new enrollment
POST /api/webhooks/wordpress/enrollment

// Sejoli: Webhook on new order
POST /api/webhooks/sejoli/order

// Both: Automatic import to Eksporyuk
```

### Phase 3: Decommission Old Systems
```
1. Set WordPress to read-only
2. Redirect Sejoli orders to Eksporyuk
3. Full migration complete ✅
```

---

## 📋 Summary

### ✅ Data Import Complete

| Data Source | Data Imported | Destination | Status |
|-------------|---------------|-------------|--------|
| **WordPress** | Users, Courses, Lessons, Progress, Certificates | Eksporyuk DB | ✅ Centralized |
| **Sejoli** | Orders, Transactions, Memberships, Affiliates, Commissions | Eksporyuk DB | ✅ Centralized |

### ✅ System Benefits

1. **Single Database** - Semua data di Eksporyuk
2. **Unified Dashboard** - Admin manage semua di 1 tempat
3. **Complete Analytics** - Track semua activity & revenue
4. **Consistent UX** - User login 1x, akses semua
5. **Easy Maintenance** - Update 1 sistem saja

### ✅ Future-Proof

- ✅ Scalable - Easy to add more features
- ✅ Maintainable - 1 codebase, 1 database
- ✅ Auditable - Complete history dari semua sources
- ✅ Reliable - Single source of truth

---

**Status**: ✅ **READY FOR IMPLEMENTATION** - Complete import strategy documented!

**Last Updated**: 9 Desember 2025
