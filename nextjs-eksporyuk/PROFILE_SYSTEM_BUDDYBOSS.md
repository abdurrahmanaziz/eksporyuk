# 🎨 Sistem Profil BuddyBoss Style

## Overview

Sistem profil lengkap dengan desain BuddyBoss dan URL bersih seperti Instagram/TikTok:
- ✅ **Clean URLs** - `eksporyuk.com/username` (tanpa `/profile/`)
- ✅ Cover Photo (seperti Facebook/LinkedIn)
- ✅ Avatar dengan upload
- ✅ Role-specific stats dan feed
- ✅ Follow/Unfollow system
- ✅ Public profile view
- ✅ Activity timeline
- ✅ Role-based tabs (Products, Courses, Links)

---

## Database Changes

### User Model - Added Fields

```prisma
model User {
  coverImage  String?  // Cover photo URL
  // ... existing fields
}
```

**Migration:** Schema updated dengan `prisma db push`

---

## API Endpoints

### 1. Cover Photo Upload

**POST** `/api/user/cover`
- Upload cover photo (max 10MB)
- Validates: image types only
- Auto-creates `/public/uploads/covers/` directory
- Returns: `{ success: true, coverUrl: '/uploads/covers/...' }`

**DELETE** `/api/user/cover`
- Remove cover photo
- Sets coverImage to null

### 2. Public Profile Data

**GET** `/api/user/[username]`
- Fetch complete user profile
- Returns:
  - User data (avatar, cover, bio, stats)
  - Recent posts (10 latest)
  - Role-specific data:
    - **SUPPLIER**: Published products
    - **MENTOR**: Published courses
    - **AFFILIATE**: Top links (own profile only)
  - Follow status
  - Group memberships

**Response Structure:**
```typescript
{
  user: {
    id, name, username, avatar, coverImage, bio, role,
    province, city, locationVerified,
    isOnline, lastSeenAt, createdAt,
    isOwnProfile, isFollowing,
    _count: {
      posts, followers, following, 
      groupMemberships, courseEnrollments
    },
    // Role-specific profiles
    supplierProfile?: { ... },
    affiliateProfile?: { ... },
    mentorProfile?: { ... }
  },
  posts: [ ... ],
  roleData: {
    products?: [ ... ],  // For SUPPLIER
    courses?: [ ... ],   // For MENTOR
    topLinks?: [ ... ]   // For AFFILIATE (own profile)
  }
}
```

---

## Pages

### 1. Public Profile Page

**Route:** `/profile/[username]`

**Features:**
- 🖼️ **Cover Photo**
  - Full-width banner (h-64 md:h-80)
  - Gradient default (blue → purple)
  - Upload button (own profile only)
  - Image preview with Next.js Image

- 👤 **Profile Header**
  - Avatar with online status indicator
  - Name + special badges (Founder, Co-Founder)
  - Role badge with icon
  - Location with verification badge
  - Bio
  - Member since date

- 📊 **Stats Grid**
  - Posts count
  - Followers
  - Following
  - Groups
  - Students (MENTOR only)

- 🔘 **Action Buttons**
  - Own profile: "Edit Profil" → `/profile`
  - Others: "Ikuti/Berhenti Ikuti" + "Pesan"

- 📑 **Content Tabs**
  - **Timeline**: User's recent posts with images
  - **About**: Detailed user info + role-specific data
  - **Produk** (SUPPLIER): Product grid with images
  - **Kursus** (MENTOR): Course grid with enrollment count
  - **Link Afiliasi** (AFFILIATE, own only): Top links stats

**Design:**
- BuddyBoss-style layout
- Dark mode support
- Responsive grid
- Hover effects on cards
- Gradient badges

### 2. Profile Settings Page

**Route:** `/profile`

**New Section:** Cover Photo Upload
- Card with preview (h-48)
- Gradient default background
- Hover overlay with buttons:
  - Upload Cover (with file input)
  - Remove Cover (if exists)
- Max 10MB file size
- Loading state during upload

---

## Role-Specific Features

### 🔷 ADMIN
- Special "Administrator" badge (red)
- Shield icon
- Access to all admin features

### 🔷 SUPPLIER
- Blue badge
- Company name display
- Product tab with grid:
  - Product images
  - Title, category, price
  - Link to `/supplier/products/[slug]`
- Business category info
- Total products count

### 🔷 AFFILIATE
- Green badge
- Affiliate code display
- Top 5 links with stats:
  - Total clicks
  - Total conversions
- Tier level
- Total earnings (own profile only)
- Privacy: Links only visible to owner

### 🔷 MENTOR
- Purple badge
- Expertise badges
- Years of experience
- Hourly rate
- Star rating
- Courses tab with grid:
  - Course thumbnail
  - Title
  - Enrollment count
  - PRO badge or price
  - Link to `/courses/[slug]`

### 🔷 MEMBER (PRO/FREE)
- Yellow (PRO) or Gray (FREE) badge
- Standard profile features
- Activity timeline
- Group memberships

---

## UI Components Used

### Cards & Layout
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Avatar`, `AvatarImage`, `AvatarFallback`

### Interactive
- `Button` with variants (default, outline, destructive)
- `Badge` with custom colors
- `Image` (Next.js) for optimized loading

### Icons (Lucide React)
- User, MapPin, Calendar, Users
- FileText, MessageCircle, Heart, Star
- Shield, Crown, Package, BookOpen
- Camera, Loader2, UserPlus, UserMinus
- Settings, ExternalLink, TrendingUp

---

## Social Features

### Follow System
- `handleFollow()` function
- Toggles follow/unfollow
- Updates follower count
- Shows button state
- Toast notifications

### Messaging
- "Pesan" button → `/chat?user={userId}`
- Opens direct message

### Activity Feed
- Recent posts display
- Post images in grid (2 columns, 4 max)
- Author info with avatar
- Group context (if posted in group)
- Like & comment counts
- Relative time display

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── user/
│   │       ├── cover/route.ts          # Cover upload/delete
│   │       └── [username]/route.ts     # Public profile data
│   └── (dashboard)/
│       ├── [username]/page.tsx         # Public profile (clean URL)
│       └── profile/
│           ├── page.tsx                # Settings (added cover upload)
│           └── notifications/          # Notification settings
└── public/
    └── uploads/
        └── covers/                     # Cover photos storage
```

---

## Usage Examples

### Upload Cover Photo

```typescript
const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('cover', file)

  const response = await fetch('/api/user/cover', {
    method: 'POST',
    body: formData,
  })

  if (response.ok) {
    const data = await response.json()
    // data.coverUrl = '/uploads/covers/...'
  }
}
```

### View Public Profile

```typescript
// Navigate to: /johndoe (clean URL like Instagram/TikTok)
// Shows:
// - Cover photo + avatar
// - Stats (posts, followers, etc.)
// - Recent activity
// - Role-specific content
```

### Follow User

```typescript
const handleFollow = async (userId: string) => {
  await fetch('/api/users/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
}
```

---

## Role Badge Configuration

```typescript
const getRoleBadgeColor = (role: string) => {
  const colors = {
    ADMIN: 'bg-red-500',
    SUPPLIER: 'bg-blue-500',
    AFFILIATE: 'bg-green-500',
    MENTOR: 'bg-purple-500',
    MEMBER_PRO: 'bg-yellow-500',
    MEMBER_FREE: 'bg-gray-500',
  }
  return colors[role] || 'bg-gray-500'
}

const getRoleLabel = (role: string) => {
  const labels = {
    ADMIN: 'Administrator',
    SUPPLIER: 'Supplier',
    AFFILIATE: 'Afiliasi',
    MENTOR: 'Mentor',
    MEMBER_PRO: 'Member Pro',
    MEMBER_FREE: 'Member Free',
  }
  return labels[role] || role
}
```

---

## Responsive Design

### Mobile (< 768px)
- Cover: h-64
- Avatar: h-32 w-32
- Stats: 2 columns
- Tabs: Full width
- Cards: 1 column

### Desktop (≥ 768px)
- Cover: h-80
- Profile: Flex row layout
- Stats: 5 columns
- Products/Courses: 3 columns

---

## Security & Privacy

### Permission Checks
- ✅ Cover upload: Only authenticated users
- ✅ Own profile detection: `isOwnProfile` flag
- ✅ Affiliate links: Only visible to owner
- ✅ Email change stats: Hidden from public

### Data Filtering
- ✅ Public posts only (or from PUBLIC groups)
- ✅ Published products/courses only
- ✅ Role-specific data loaded conditionally

---

## Performance Optimizations

### Image Handling
- Next.js `Image` component with `fill` layout
- Priority loading for cover images
- Lazy loading for post images
- Responsive image sizes

### Data Fetching
- Single API call for complete profile
- Includes count optimizations (_count)
- Limited to 10 recent posts
- Conditional role data loading

---

## Future Enhancements

### Possible Additions
1. **Cover Photo Editor**
   - Crop & resize before upload
   - Filters & adjustments
   
2. **Activity Types**
   - Course enrollments
   - Product purchases
   - Achievements

3. **Profile Themes**
   - Custom color schemes
   - Layout variations

4. **Analytics**
   - Profile views
   - Engagement metrics

---

## Testing Checklist

### ✅ Completed
- [x] Upload cover photo
- [x] Remove cover photo
- [x] View public profile
- [x] Display role-specific data
- [x] Follow/unfollow functionality
- [x] Send message button
- [x] Edit profile button (own)
- [x] Activity timeline
- [x] Responsive layout
- [x] Dark mode support

### 🔄 To Test
- [ ] Cover photo with different sizes
- [ ] Profile with no posts
- [ ] Profile with no groups
- [ ] Different role profiles
- [ ] Loading states
- [ ] Error handling

---

## Troubleshooting

### Cover Photo Not Showing
- Check file uploaded to `/public/uploads/covers/`
- Verify database has correct coverImage path
- Ensure file permissions are correct

### Role Data Missing
- Verify user has required profile (supplierProfile, etc.)
- Check API endpoint includes role data
- Ensure products/courses are PUBLISHED status

### Follow Button Not Working
- Check `/api/users/follow` endpoint exists
- Verify authentication session
- Check Follow model in database

---

## Summary

✨ **Sistem profil BuddyBoss dengan:**
- Cover photo + avatar
- Stats komprehensif per role
- Feed personalisasi
- Social features (follow, message)
- Role-specific content tabs
- Responsive & dark mode ready

🎯 **Semua role sudah support:**
- ADMIN, SUPPLIER, AFFILIATE, MENTOR, MEMBER_PRO, MEMBER_FREE

📱 **Ready for production:**
- Database updated
- APIs complete
- UI implemented
- Security checks in place
