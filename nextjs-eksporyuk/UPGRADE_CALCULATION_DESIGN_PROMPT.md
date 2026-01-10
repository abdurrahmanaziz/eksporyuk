# Design Prompt: Membership Upgrade & Prorata Calculation UI

## Project Context
Platform membership edutech untuk ekspor business. User yang sudah punya paket aktif bisa upgrade ke paket lebih tinggi dengan sistem prorata (diskon sesuai sisa waktu paket lama).

---

## 🎨 DESIGN REQUEST

### Page 1: Upgrade Package Selection Page
**URL**: `/member/upgrade`

#### Layout Structure:
1. **Header Section** (centered, gradient background)
   - Icon: Crown dengan background circle blur warna primary
   - Title: "Upgrade Membership" (bold, 24px)
   - Subtitle: "Tingkatkan pengalaman belajar Anda dengan fitur eksklusif dan akses unlimited"
   - 3 Trust badges horizontal:
     - ✓ Aman (green check icon)
     - ⚡ Instan (lightning icon)
     - ⭐ Premium (star icon)

2. **Current Package Banner** (if user has active membership)
   - Green background with subtle pattern
   - Left side: Badge "Paket Aktif"
   - Center: Package name + duration (e.g., "Paket 6 Bulan")
   - Right side: Countdown "Berakhir dalam X hari"

3. **Package Cards Grid** (3 columns on desktop, 1 column on mobile)
   
   **Card Structure** (each package):
   - Card border: 2px solid, rounded-2xl
   - Active package: Green border with "Paket Aktif Anda" badge
   - Best seller: Red corner ribbon "BEST SELLER"
   - Popular: Blue badge at top
   
   **Card Content**:
   - Header:
     - Package name (bold, 18px)
     - Duration badge (e.g., "Durasi 6 Bulan")
   - Price section:
     - Large price: "Rp 1598K" (28px, bold)
     - "/bulan" text below (12px, gray)
     - Original price strikethrough if discount exists
   - Features list (4-5 items):
     - Green checkmark icon + feature text
     - Icons: Check, Users, BookOpen, Video, Shield
   - Button:
     - Current package: Green button "Paket Aktif Anda" (disabled state)
     - Upgradeable: Blue gradient button "🧮 Lihat Perhitungan Upgrade"
     - Lifetime: Purple gradient button "🚀 Upgrade ke Lifetime"

4. **Why Upgrade Section** (below cards)
   - 3 benefit cards with icons:
     - 📚 Akses Unlimited
     - 👥 Komunitas Eksklusif  
     - 🚀 Update Terbaru

5. **Support CTA** (bottom)
   - Question prompt
   - 2 buttons: "Dashboard" (outline) + "Hubungi Support" (filled)

#### Design Style:
- **Color Palette**:
  - Primary: #3B82F6 (blue)
  - Success: #10B981 (green)
  - Warning: #F59E0B (amber)
  - Purple: #8B5CF6
  - Background: #F9FAFB (light gray)
  
- **Spacing**:
  - Container: max-width 1200px, padding 24px
  - Card gap: 16px
  - Section margin: 24px vertical

- **Typography**:
  - Heading: Inter/SF Pro, bold, 24-28px
  - Body: Inter/SF Pro, regular, 14-16px
  - Price: Inter/SF Pro, bold, 28px
  - Badge: Inter/SF Pro, semibold, 12px

- **Effects**:
  - Card shadow: 0 4px 6px rgba(0,0,0,0.1)
  - Hover: shadow lift + scale 1.02
  - Button hover: brightness 110%
  - Smooth transitions: 200ms ease

---

### Page 2: Upgrade Calculation Modal
**Triggered by**: Click "Lihat Perhitungan Upgrade" button

#### Modal Structure:

1. **Modal Overlay**
   - Full screen dark overlay: rgba(0,0,0,0.6)
   - Backdrop blur: 8px
   - Center aligned modal

2. **Modal Container**
   - Max width: 600px
   - Background: white
   - Rounded: 24px
   - Shadow: 0 20px 50px rgba(0,0,0,0.3)
   - Max height: 90vh with scroll

3. **Modal Header** (sticky top)
   - Background: white with border bottom
   - Padding: 20px 24px
   - Left side:
     - Calculator icon in circle (blue background 15% opacity)
     - Title: "Perhitungan Upgrade" (bold, 18px)
     - Subtitle: "Detail biaya dan diskon prorata" (12px, gray)
   - Right side:
     - Close button (X icon, hover gray background)

4. **Modal Content** (scrollable)

   **A. Current vs Target Comparison**
   - 2 columns side by side
   - Center arrow icon between them (→ in circle with primary color border)
   
   **Left Card - Current Package**:
   - Background: gray-50
   - Border: gray-200
   - Label: "Paket Sekarang" (small, gray)
   - Package name (bold, 16px)
   - Duration text (14px, gray)
   - Price (large, 20px)
   - Divider line
   - Clock icon + "Sisa X hari" (small, gray)
   
   **Right Card - Target Package**:
   - Background: primary color 5% opacity
   - Border: primary color (2px)
   - Label: "Paket Tujuan" (small, primary color)
   - Package name (bold, 16px)
   - Duration text (14px, gray)
   - Price (large, 20px)
   - Divider line
   - TrendingUp icon + "Upgrade Premium" (small, primary color, bold)

   **B. Calculation Breakdown**
   - Background: gradient from blue-50 to purple-50
   - Border: blue-100
   - Padding: 16px
   - Border radius: 16px
   
   Content:
   - Header: Percent icon + "Rincian Perhitungan Prorata" (bold, 14px)
   - Row 1: "Harga paket tujuan" → "Rp X.XXX.XXX" (aligned right)
   - Row 2 (if discount): "Nilai sisa paket sekarang" (green text) → "- Rp XXX.XXX" (green, aligned right)
     - With check icon
   - Divider line (gradient)
   - Total row:
     - Left: "Total Pembayaran" (bold, 16px)
     - Right: 
       - Main price: "Rp X.XXX.XXX" (primary color, bold, 20px)
       - Savings text: "Hemat Rp XXX.XXX!" (green, 12px, below)

   **C. Lifetime Warning** (if applicable)
   - Background: amber-50
   - Border: amber-200
   - Padding: 16px
   - Rocket icon in amber circle
   - Title: "Upgrade ke Lifetime" (bold, 14px, amber-900)
   - Description: "Paket Lifetime memerlukan pembayaran penuh..." (12px, amber-700)

   **D. Info Message** (if any)
   - Background: blue-50
   - Border: blue-200
   - Text: blue-900, 14px

5. **Modal Footer** (action buttons)
   - 2 buttons side by side (equal width)
   
   **Cancel Button**:
   - Background: gray-100
   - Hover: gray-200
   - Text: "Batal" (gray-700, semibold)
   - Border radius: 12px
   - Padding: 12px vertical
   
   **Proceed Button**:
   - Background: primary gradient
   - Shadow: medium
   - Text: "Lanjutkan ke Pembayaran" + arrow icon
   - White text, semibold
   - Border radius: 12px
   - Padding: 12px vertical
   - Hover: shadow large + slight scale
   - Loading state: spinner + "Memproses..." text

---

## 📱 RESPONSIVE BEHAVIOR

### Mobile (< 768px):
- Package cards: 1 column, full width
- Comparison cards: stack vertically (current on top, arrow down, target below)
- Modal: 95% width, slide up animation
- Buttons: full width stacked
- Font sizes: reduce by 10%

### Tablet (768px - 1024px):
- Package cards: 2 columns
- Modal: 80% width max 600px
- Comparison: side by side but smaller padding

### Desktop (> 1024px):
- Package cards: 3 columns
- Modal: centered, max 600px
- Full hover effects active

---

## 🎭 INTERACTION STATES

### Button States:
1. **Default**: Base color, shadow
2. **Hover**: Brightness 110%, shadow lift
3. **Active/Click**: Scale 95%, shadow reduce
4. **Loading**: 
   - Opacity 50%
   - Cursor: wait
   - Spinner animation (border spin)
5. **Disabled**:
   - Opacity 50%
   - Cursor: not-allowed
   - No hover effects

### Card States:
1. **Default**: Border 2px, subtle shadow
2. **Hover**: Shadow lift (0 8px 16px), border glow
3. **Active Package**: Green border, green badge
4. **Processing**: Shimmer overlay animation

### Modal Animation:
- **Enter**: Fade in overlay (300ms) + scale modal from 95% to 100% (200ms)
- **Exit**: Fade out overlay (200ms) + scale modal to 95% (150ms)

---

## 🎨 VISUAL EXAMPLES TO INCLUDE

### Color Tokens:
```
Primary Blue: #3B82F6
Primary Hover: #2563EB
Success Green: #10B981
Warning Amber: #F59E0B
Purple: #8B5CF6
Gray 50: #F9FAFB
Gray 100: #F3F4F6
Gray 200: #E5E7EB
Gray 600: #4B5563
Gray 900: #111827
```

### Shadow Tokens:
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.15)
2xl: 0 25px 50px rgba(0,0,0,0.25)
```

### Radius Tokens:
```
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
full: 9999px
```

---

## 💡 SPECIAL REQUIREMENTS

### Accessibility:
- WCAG AA contrast ratios (4.5:1 minimum)
- Focus states: 2px primary color outline
- Screen reader labels for icons
- Keyboard navigation support

### Performance:
- Images optimized (WebP format)
- Icons: SVG inline or icon font
- Animations: GPU accelerated (transform/opacity only)
- Lazy load below-fold content

### Micro-interactions:
- Button clicks: ripple effect
- Price numbers: count-up animation when modal opens
- Success state: checkmark animation
- Loading: smooth spinner rotation

---

## 📐 EXACT SPECIFICATIONS

### Package Card Dimensions:
- Width: 100% (grid handles responsive)
- Min height: 480px
- Padding: 24px
- Border radius: 20px
- Border width: 2px

### Modal Dimensions:
- Width: 600px max (90% on mobile)
- Max height: 90vh
- Padding: 0 (children handle own padding)
- Border radius: 24px

### Icon Sizes:
- Large (hero): 36px
- Medium (features): 20px
- Small (inline): 16px

### Button Dimensions:
- Height: 48px (desktop), 44px (mobile)
- Padding horizontal: 24px
- Font size: 14px
- Font weight: 600

---

## 🎯 USER FLOW SCENARIO

### Example Calculation Display:
**User**: Has "Paket 6 Bulan" (Rp 1,800,000), 179 days remaining
**Target**: Upgrade to "Paket 12 Bulan" (Rp 1,800,000)

**Modal Should Show**:
- Current: Paket 6 Bulan - Rp 1,800,000 - Sisa 179 hari
- Target: Paket 12 Bulan - Rp 1,800,000
- Calculation:
  - Harga paket tujuan: Rp 1,800,000
  - Nilai sisa paket: - Rp 666,000 (green)
  - **Total: Rp 1,134,000** (blue, bold)
  - Hemat Rp 666,000! (green badge)

---

## 📱 FIGMA/SKETCH DELIVERABLES NEEDED

1. **Desktop View** (1440px width):
   - Upgrade page full layout
   - Modal overlay state
   - All button states (default, hover, active, disabled)
   - All card variations (active, best seller, popular)

2. **Mobile View** (375px width):
   - Upgrade page stacked layout
   - Modal mobile view
   - Touch-friendly button sizes

3. **Component Library**:
   - Package card component (all variants)
   - Modal component (reusable)
   - Button component (all states)
   - Badge component (all colors)

4. **Animation Specs**:
   - Modal enter/exit animation timeline
   - Button interaction states
   - Price counter animation
   - Loading spinner

---

## 🎨 BRAND GUIDELINES

### Tone & Voice:
- Professional yet friendly
- Clear and transparent (especially for pricing)
- Trust-building (security badges, guarantees)
- Exciting for premium features (emojis ok in CTAs)

### Copy Suggestions:
- Buttons: Action-oriented (Lihat, Upgrade, Lanjutkan)
- Savings: Emphasize discount (Hemat Rp XXX!)
- Trust: Show benefits clearly (Akses Unlimited, dll)
- Urgency: Subtle (Sisa X hari, not aggressive)

---

## ✅ DESIGN CHECKLIST

Before finalizing, ensure:
- [ ] All text readable on all backgrounds (contrast check)
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Loading states designed for all async actions
- [ ] Error states designed (if calculation fails)
- [ ] Empty states designed (if no upgradeable packages)
- [ ] Success states designed (after successful upgrade)
- [ ] Dark mode consideration (bonus)
- [ ] RTL support consideration (bonus)

---

## 🔗 REFERENCE LINKS

Similar upgrade flows to reference:
- WatZap.id upgrade page
- Notion pricing page
- Stripe customer portal
- Netflix plan change flow
- Spotify Premium upgrade

Design systems to reference:
- Tailwind UI components
- Radix UI primitives
- shadcn/ui components
- Material Design 3

---

## 📝 NOTES FOR DESIGNER

1. **Priority**: Modal calculation is the most critical UI - users must understand the prorata discount clearly
2. **Trust**: Show all calculation transparently, no hidden fees
3. **Simplicity**: Keep it simple - don't overwhelm with too many options
4. **Mobile-first**: Most users will view on mobile, optimize for that
5. **Performance**: Animations should feel snappy, not laggy
6. **Accessibility**: Color shouldn't be the only indicator (use icons + text)

---

## 💬 FEEDBACK QUESTIONS FOR DESIGNER

Please provide in your deliverable:
1. How does the calculation modal handle very long package names?
2. What happens if there are more than 5 features in a package?
3. How does the layout adapt for packages with very different prices?
4. What's the animation timing for the modal entrance?
5. Are there any edge cases we should consider?

---

**Deadline**: [Insert deadline]
**Format**: Figma file with auto-layout + component variants
**Handoff**: Include design tokens JSON + interaction spec document
