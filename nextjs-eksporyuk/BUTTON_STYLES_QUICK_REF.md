# Button Styles Quick Reference

## 🎨 4 Button Styles Available

### 1. Simple Button (default)
- **When to use**: Generic links, CTAs, custom URLs
- **Fields needed**: buttonText, backgroundColor, textColor
- **Example**: "Download Template", "Join Grup", "Contact Me"

### 2. Card (Vertical)
- **When to use**: Products, courses, featured items
- **Fields needed**: buttonText, thumbnailUrl, subtitle, price
- **Best for**: Square/portrait images
- **Layout**: Image top, content below

### 3. Card Horizontal
- **When to use**: Compact listings, multiple items
- **Fields needed**: buttonText, thumbnailUrl, subtitle, price (optional)
- **Best for**: Landscape images or thumbnails
- **Layout**: Image left, content right

### 4. Card Product
- **When to use**: E-commerce, paid products, premium offers
- **Fields needed**: buttonText, thumbnailUrl, subtitle, price, originalPrice
- **Special**: Gradient background, discount badge
- **Layout**: Enhanced product card

---

## 🔧 Quick Setup Guide

### Admin Steps
1. Go to `/affiliate/bio`
2. Click "Tambah CTA Button"
3. Select "Style Tampilan":
   - Button Biasa
   - Card Vertikal
   - Card Horizontal
   - Card Produk
4. For cards: Add subtitle, thumbnail URL, price
5. Toggle display options
6. Save

### Database Fields
```javascript
{
  buttonStyle: 'button' | 'card' | 'card-horizontal' | 'card-product',
  thumbnailUrl: string | null,
  price: string | null,
  originalPrice: string | null,
  subtitle: string | null,
  showPrice: boolean,
  showThumbnail: boolean
}
```

---

## 📊 API Usage

### Create CTA with Card Style
```javascript
POST /api/affiliate/bio/cta

{
  "buttonText": "Premium Course",
  "buttonType": "course",
  "buttonStyle": "card",
  "courseId": "course-id",
  "thumbnailUrl": "https://...",
  "subtitle": "Learn export business",
  "price": "Rp 299.000",
  "originalPrice": "Rp 499.000",
  "showPrice": true,
  "showThumbnail": true,
  "backgroundColor": "#3B82F6",
  "textColor": "#FFFFFF"
}
```

---

## 🎯 Layout Combinations

### Best Practices

**Stack Layout** (vertical):
- Mix all 4 styles freely
- Great for varied content

**Grid 2 Layout**:
- Use same style for consistency
- Or alternate: button + card

**Grid 3 Layout**:
- Use horizontal cards for compact view
- Simple buttons for uniform height

**Compact Layout**:
- Stick to simple buttons
- Or use horizontal cards only

**Masonry Layout**:
- Mix card styles for dynamic feel
- Product cards for featured items

---

## 🧪 Testing Commands

```bash
# Create sample CTAs with all styles
node test-button-styles.js

# Cleanup test data
node test-button-styles.js --cleanup

# View demo
# Visit: /bio/demo-affiliate
```

---

## 🐛 Troubleshooting

### Card Not Showing Image
- Check `showThumbnail: true`
- Verify `thumbnailUrl` is valid
- Check image URL is accessible

### Price Not Displaying
- Ensure `showPrice: true`
- Check `price` field has value
- Verify format: "Rp 299.000"

### Style Not Changing
- Clear browser cache
- Check `buttonStyle` value
- Verify Prisma sync: `npx prisma db push`

---

## 📱 Mobile Responsiveness

All button styles are mobile-responsive:
- Cards stack properly
- Images scale to fit
- Text wraps naturally
- Touch-friendly click areas

Grid layouts adjust automatically:
- Grid 3 → Grid 2 on mobile
- Masonry maintains aspect ratios

---

## 🔄 Migration Notes

### Existing CTAs
- Auto-default to `buttonStyle: "button"`
- No action needed
- Zero breaking changes

### Updating Old CTAs
1. Edit CTA in admin
2. Change style to card
3. Add thumbnail/price
4. Toggle display options
5. Save

---

## 💡 Pro Tips

1. **Product Cards**: Use `card-product` for best visual impact
2. **Consistency**: Keep similar items in same style
3. **Images**: Use 400x300px for best results
4. **Prices**: Format consistently: "Rp 299.000"
5. **Subtitles**: Keep under 60 characters
6. **Testing**: Preview on mobile before publishing
7. **Loading**: Use optimized images (<200KB)

---

## 📚 Related Docs

- Full Feature Guide: `BUTTON_STYLES_COMPLETE.md`
- Schema Reference: `prisma/schema.prisma` (line 2375)
- Admin Page: `src/app/(affiliate)/affiliate/bio/page.tsx`
- Public View: `src/app/bio/[username]/PublicBioView.tsx`

---

## ✅ Checklist for New CTAs

- [ ] Choose appropriate button style
- [ ] Add clear button text
- [ ] Upload/add thumbnail (for cards)
- [ ] Write concise subtitle
- [ ] Format price correctly
- [ ] Toggle display options
- [ ] Select button type (membership/product/course/custom)
- [ ] Set colors (if button style)
- [ ] Preview on public page
- [ ] Test click tracking

---

## 🎉 Feature Status

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Tested**: Yes
**Documentation**: Complete
**Backward Compatible**: Yes

**Last Updated**: December 2024
