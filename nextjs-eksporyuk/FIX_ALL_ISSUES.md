# Fix All Issues - Task List

## 1. Postingan belum bisa ✅
- Check API endpoint `/api/posts` untuk create
- Verify form submission di grup page

## 2. Grup privat bisa diklik dan gabung ❌  
- File: `/community/groups/[slug]/page.tsx`
- Add membership check before allowing join
- Show upgrade prompt for membership-required groups

## 3. Halaman /saved-posts error ❌
- File: `/saved-posts/page.tsx`  
- Check Prisma query dan relations

## 4. Hapus quota buyer/forwarder/dokumen/supplier ❌
- Remove quota checks untuk semua role
- User dengan membership bebas akses

## 5. /learn kursus premium tidak muncul ❌
- File: `/learn/page.tsx`
- Check enrollment query dan filter

## 6. /certificates error ❌
- File: `/certificates/page.tsx`
- Fix Prisma query

Status: Starting fixes...
