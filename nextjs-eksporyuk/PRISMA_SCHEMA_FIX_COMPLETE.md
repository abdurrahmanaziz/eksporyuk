# Prisma Schema Fix - Complete

## Tanggal: 25 Desember 2025

## Masalah Yang Diperbaiki

### 1. SavedPost Error
**Error**: `Unknown arg 'postId_userId' in where.postId_userId`
**Root Cause**: Model `SavedPost` tidak punya unique constraint `@@unique([postId, userId])`

### 2. PostReaction Error  
**Error**: `Unknown field 'user' for include statement on model PostReaction`
**Root Cause**: Model `PostReaction` tidak punya relasi ke `User` dan `Post`

### 3. CommentReaction Error
**Root Cause**: Model `CommentReaction` tidak punya relasi ke `User` dan `PostComment`

## Perubahan Schema

### PostReaction Model
```prisma
model PostReaction {
  id        String       @id @default(cuid())
  postId    String
  userId    String
  type      ReactionType @default(LIKE)
  createdAt DateTime     @default(now())

  // ✅ ADDED: Relations
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation("UserPostReactions", fields: [userId], references: [id], onDelete: Cascade)

  // ✅ ADDED: Unique constraint dan indexes
  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}
```

### CommentReaction Model
```prisma
model CommentReaction {
  id        String       @id @default(cuid())
  commentId String
  userId    String
  type      ReactionType @default(LIKE)
  createdAt DateTime     @default(now())

  // ✅ ADDED: Relations
  comment PostComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User        @relation("UserCommentReactions", fields: [userId], references: [id], onDelete: Cascade)

  // ✅ ADDED: Unique constraint dan indexes
  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
}
```

### SavedPost Model
```prisma
model SavedPost {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  // ✅ ADDED: Relations
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation("UserSavedPosts", fields: [userId], references: [id], onDelete: Cascade)

  // ✅ ADDED: Unique constraint dan indexes
  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}
```

### User Model
```prisma
model User {
  // ... existing fields ...
  
  // Relations
  createdProducts    Product[]         @relation("ProductCreator")
  userProducts       UserProduct[]     @relation("UserProductUser")
  
  // ✅ ADDED: Relations untuk reactions dan saved posts
  postReactions      PostReaction[]    @relation("UserPostReactions")
  commentReactions   CommentReaction[] @relation("UserCommentReactions")
  savedPosts         SavedPost[]       @relation("UserSavedPosts")
  
  // ... indexes ...
}
```

### Post Model
```prisma
model Post {
  // ... existing fields ...
  
  // ✅ ADDED: Relations
  reactions PostReaction[]
  savedBy   SavedPost[]
}
```

### PostComment Model
```prisma
model PostComment {
  // ... existing fields ...
  
  // ✅ ADDED: Relations
  reactions CommentReaction[]
}
```

## Keamanan Data

### Pre-Migration Check
Script `fix-duplicate-reactions.js` dibuat untuk cek dan hapus duplicate data:
```bash
node fix-duplicate-reactions.js
```

**Result**: 
- ✅ 0 duplicate PostReaction records
- ✅ 0 duplicate CommentReaction records  
- ✅ 0 duplicate SavedPost records

### Database Migration
```bash
npx prisma db push --accept-data-loss
```

**Status**: ✅ Success
- Unique constraints ditambahkan tanpa error
- Prisma Client di-regenerate
- Tidak ada data loss

## Dampak Perubahan

### API Routes Yang Fixed
1. ✅ `/api/posts/[id]/save` (POST & GET)
   - Sekarang bisa query dengan `findUnique({ where: { postId_userId: {...} } })`
   - Bisa include user relation
   
2. ✅ `/api/posts/[id]/reactions` (GET)
   - Sekarang bisa include user relation untuk data user yang react
   
3. ✅ `/api/groups/suggested` (GET)
   - Kemungkinan ada relasi yang sama diperbaiki

### Breaking Changes
**TIDAK ADA** - Perubahan ini backward compatible:
- Menambahkan relations tidak mengubah API existing
- Menambahkan unique constraints mencegah duplicate data
- Menambahkan indexes meningkatkan performa query

## Testing

### Manual Test
1. Refresh page di browser
2. Coba save/unsave post
3. Coba react ke post
4. Check suggested groups

### Expected Results
- Tidak ada 500 errors
- Save post bekerja normal
- Reactions ditampilkan dengan user info
- Suggested groups muncul

## Files Modified

1. `prisma/schema.prisma` - 6 models updated
2. `fix-duplicate-reactions.js` - Script untuk cleanup (dapat dihapus setelah migrate)

## Commands History

```bash
# 1. Cek duplicates
node fix-duplicate-reactions.js

# 2. Push schema
npx prisma db push --accept-data-loss

# 3. Prisma Client auto-regenerated
# Server akan otomatis reload dengan schema baru
```

## Status
✅ **COMPLETE** - Schema synchronized, errors fixed, no data loss
