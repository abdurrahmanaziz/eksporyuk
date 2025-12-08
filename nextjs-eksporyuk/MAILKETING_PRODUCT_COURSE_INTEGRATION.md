# 🎯 Mailketing Integration - Product & Course

## ✅ Backend Integration - COMPLETE

### API Endpoints Updated

#### **Product APIs**
✅ **POST** `/api/admin/products`
- Added fields: `mailketingListId`, `mailketingListName`, `autoAddToList`

✅ **PUT** `/api/admin/products/[id]`
- Added fields: `mailketingListId`, `mailketingListName`, `autoAddToList`

#### **Course APIs**
✅ **POST** `/api/courses`
- Added fields: `mailketingListId`, `mailketingListName`, `autoAddToList`

✅ **PATCH** `/api/courses/[id]`
- Added fields: `mailketingListId`, `mailketingListName`, `autoAddToList`

---

## 📋 Frontend Integration - TODO

### For Product Form

**File to Edit:** (Cari file form product edit/create)

**Steps:**

1. **Import Component:**
```typescript
import MailketingListSelector from '@/components/admin/MailketingListSelector'
```

2. **Add State:**
```typescript
const [formData, setFormData] = useState({
  // ... existing fields
  mailketingListId: null as string | null,
  mailketingListName: null as string | null,
  autoAddToList: true,
})
```

3. **Add to Form UI:**
```tsx
{/* Mailketing Integration */}
<div className="space-y-2">
  <MailketingListSelector
    value={formData.mailketingListId}
    listName={formData.mailketingListName}
    onChange={(listId, listName) => {
      setFormData({ 
        ...formData, 
        mailketingListId: listId,
        mailketingListName: listName
      })
    }}
  />
</div>

{formData.mailketingListId && (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="autoAddToList"
      checked={formData.autoAddToList}
      onChange={(e) => 
        setFormData({ ...formData, autoAddToList: e.target.checked })
      }
    />
    <label htmlFor="autoAddToList" className="text-sm">
      Auto-add user ke list setelah pembelian
    </label>
  </div>
)}
```

4. **Submit Handler** (Already includes ...formData, so mailketing fields auto-included)

---

### For Course Form

**File to Edit:** (Cari file form course edit/create)

**Steps:** (Sama seperti Product)

1. Import `MailketingListSelector`
2. Add state untuk mailketing fields
3. Add component di form
4. Submit handler auto-include via `...formData`

---

## 🔧 Component Reference

### MailketingListSelector Props

```typescript
interface MailketingListSelectorProps {
  value: string | null          // Current list ID
  listName: string | null       // Current list name  
  onChange: (listId: string | null, listName: string | null) => void
  disabled?: boolean            // Optional: disable selector
}
```

### Features
- ✅ Auto-fetch lists from API
- ✅ Dropdown dengan nama dan subscriber count
- ✅ Refresh button
- ✅ List ID preview dengan copy button
- ✅ Error handling dengan link ke integrations
- ✅ Instruksi penggunaan
- ✅ Responsive design

---

## 🎯 Complete Example (Reference dari Membership)

```typescript
'use client'

import { useState } from 'react'
import MailketingListSelector from '@/components/admin/MailketingListSelector'

export default function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    mailketingListId: null as string | null,
    mailketingListName: null as string | null,
    autoAddToList: true,
  })

  const handleSubmit = async () => {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData) // Mailketing fields auto-included
    })
    // ... handle response
  }

  return (
    <form>
      {/* Basic Fields */}
      <input
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Product Name"
      />

      {/* Mailketing Integration */}
      <div className="space-y-4">
        <h3>Email Marketing</h3>
        
        <MailketingListSelector
          value={formData.mailketingListId}
          listName={formData.mailketingListName}
          onChange={(listId, listName) => {
            setFormData({ 
              ...formData, 
              mailketingListId: listId,
              mailketingListName: listName
            })
          }}
        />

        {formData.mailketingListId && (
          <label>
            <input
              type="checkbox"
              checked={formData.autoAddToList}
              onChange={(e) => 
                setFormData({ ...formData, autoAddToList: e.target.checked })
              }
            />
            Auto-add user setelah pembelian
          </label>
        )}
      </div>

      <button onClick={handleSubmit}>Save Product</button>
    </form>
  )
}
```

---

## 🚀 Testing Flow

### Product Testing:
1. Create/Edit product di form product
2. Pilih list dari dropdown
3. Centang auto-add
4. Save product
5. Test purchase → User auto-subscribe ke list

### Course Testing:
1. Create/Edit course di form course
2. Pilih list dari dropdown
3. Centang auto-add
4. Save course
5. Test enrollment → User auto-subscribe ke list

---

## 📊 Database Schema (Already Updated)

```prisma
model Product {
  // ... existing fields
  mailketingListId    String?
  mailketingListName  String?
  autoAddToList       Boolean @default(true)
}

model Course {
  // ... existing fields
  mailketingListId    String?
  mailketingListName  String?
  autoAddToList       Boolean @default(true)
}
```

---

## ✅ What's Already Working

1. ✅ **API Endpoints** - Product & Course APIs support mailketing fields
2. ✅ **Database Schema** - Fields exist in Product & Course models
3. ✅ **Webhook Integration** - Auto-add works for Product & Course purchases
4. ✅ **Component** - MailketingListSelector ready to use
5. ✅ **Reference Example** - Membership form sebagai contoh

---

## 📝 Implementation Checklist

### Product Form:
- [ ] Find product form file
- [ ] Import MailketingListSelector
- [ ] Add state fields
- [ ] Add UI component
- [ ] Test create product
- [ ] Test edit product
- [ ] Test purchase flow

### Course Form:
- [ ] Find course form file
- [ ] Import MailketingListSelector
- [ ] Add state fields
- [ ] Add UI component
- [ ] Test create course
- [ ] Test edit course
- [ ] Test enrollment flow

---

## 🎨 UI Placement Recommendation

**Best Location:** Di section "Settings" atau "Marketing" atau setelah pricing fields

**Why:**
- Grouping dengan marketing features lainnya
- Tidak mengganggu flow basic product/course info
- Easy to find untuk marketing team

**Example Structure:**
```
Product Form:
├─ Basic Info (Name, Description)
├─ Pricing (Price, Sale Price)
├─ Marketing Settings ← ADD HERE
│  ├─ Affiliate Commission
│  ├─ Mailketing List ← NEW
│  └─ Auto-add to list ← NEW
└─ Advanced Settings
```

---

## 💡 Tips

1. **Copy dari Membership:**
   - Buka: `src/app/(dashboard)/admin/membership-plans/page.tsx`
   - Cari section "Mailketing Integration"
   - Copy paste ke Product/Course form
   - Adjust variable names sesuai context

2. **Testing:**
   - Dev mode returns mock lists
   - Real API akan fetch actual lists dari Mailketing
   - Test purchase flow dengan Xendit sandbox

3. **Styling:**
   - Component sudah styled
   - Tinggal masukkan ke form layout
   - Responsive by default

---

## 🔗 Related Files

**Component:**
- `src/components/admin/MailketingListSelector.tsx`

**Reference Implementation:**
- `src/app/(dashboard)/admin/membership-plans/page.tsx`

**API Endpoints:**
- `src/app/api/admin/products/route.ts`
- `src/app/api/admin/products/[id]/route.ts`
- `src/app/api/courses/route.ts`
- `src/app/api/courses/[id]/route.ts`

**Webhook (Auto-add):**
- `src/app/api/webhooks/xendit/route.ts`

---

**Last Updated:** November 24, 2025  
**Status:** 🔧 Backend Ready | 📋 Frontend TODO
