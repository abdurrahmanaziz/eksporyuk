# 🧪 Testing Guide: Modern Learn Page

## Quick Test Steps

### 1. Access the Learning Page
```
URL: http://localhost:3000/courses/sample-course-basic/learn
Login: premium@eksporyuk.com / password123
```

### 2. YouTube Video Test
✅ **Expected Result:**
- Video player shows YouTube embed (iframe)
- Video plays when you click play button
- Video has YouTube controls (play, pause, volume, fullscreen)
- Video ID: `sDJFbpMzyIU`

❌ **Old Behavior:**
- Black screen with "Your browser does not support the video tag"
- No video playback

---

## 🎨 Visual Checks

### Header
- [ ] Sticky header with gradient background
- [ ] "Kembali" button navigates to course detail
- [ ] Progress bar shows percentage
- [ ] Responsive on mobile (hamburger menu)

### Sidebar
- [ ] Module 1 is expanded by default
- [ ] Click module header to collapse/expand
- [ ] Current lesson has blue gradient background
- [ ] Completed lessons have green checkmark
- [ ] Module progress bar shows correct percentage
- [ ] Lesson count displays (e.g., "0/1")

### Video Player
- [ ] Full-width aspect ratio (16:9)
- [ ] YouTube iframe loads successfully
- [ ] Video plays without errors
- [ ] Controls are visible and functional

### Content Area
- [ ] Lesson title is large and readable
- [ ] "Tandai Selesai" button appears
- [ ] Button changes to "Pelajaran Selesai!" after clicking
- [ ] Navigation buttons at bottom (Previous/Next)
- [ ] Previous button disabled (first lesson)

---

## 📱 Responsive Tests

### Mobile (< 640px)
1. Resize browser to 375px width
2. Check:
   - [ ] Sidebar hidden by default
   - [ ] Hamburger menu button visible
   - [ ] Click hamburger → sidebar slides in
   - [ ] Dark overlay appears behind sidebar
   - [ ] Click overlay → sidebar closes
   - [ ] Progress shows percentage only (no bar)

### Tablet (768px)
1. Resize browser to 768px width
2. Check:
   - [ ] Sidebar toggleable with button
   - [ ] Content area has proper spacing
   - [ ] Video player scales correctly

### Desktop (> 1024px)
1. Resize browser to 1920px width
2. Check:
   - [ ] Sidebar always visible
   - [ ] No hamburger menu button
   - [ ] Full progress bar in header
   - [ ] Content centered with max-width

---

## 🎯 Functionality Tests

### Module Expansion
1. Click "Module 1" header
2. **Expected:** Module collapses (lessons hidden)
3. Click again
4. **Expected:** Module expands (lessons visible)

### Lesson Navigation
1. Click "Tandai Selesai"
2. **Expected:** 
   - Button changes to completion badge
   - Progress updates (e.g., 0% → 100%)
   - Green checkmark appears in sidebar
3. Click "Selanjutnya" (if multiple lessons)
4. **Expected:**
   - New lesson loads
   - Video changes
   - URL updates with `?lesson=ID`

### Video Playback
1. Click play button on YouTube video
2. **Expected:** Video plays
3. Click pause
4. **Expected:** Video pauses
5. Test fullscreen
6. **Expected:** Video enters fullscreen mode

---

## 🐛 Common Issues & Fixes

### Issue: Video Not Playing
**Symptoms:** Black screen, "Playback error"
**Fix:** Check if videoUrl is valid YouTube link

### Issue: Sidebar Not Collapsing
**Symptoms:** Click module header, nothing happens
**Fix:** Check browser console for errors

### Issue: Responsive Menu Not Working
**Symptoms:** Hamburger menu doesn't open sidebar
**Fix:** Clear browser cache and reload

### Issue: Progress Not Updating
**Symptoms:** Click "Tandai Selesai", progress stays 0%
**Fix:** Check network tab for API errors

---

## 🎥 Video URL Formats Supported

✅ **Supported YouTube URLs:**
```
https://youtu.be/sDJFbpMzyIU
https://www.youtube.com/watch?v=sDJFbpMzyIU
https://youtube.com/watch?v=sDJFbpMzyIU
https://www.youtube.com/embed/sDJFbpMzyIU
```

✅ **Supported Direct Video URLs:**
```
https://example.com/video.mp4
https://example.com/video.webm
https://example.com/video.ogg
```

❌ **Not Supported:**
```
Vimeo links
Facebook video links
Instagram videos
TikTok videos
```

---

## 🚀 Performance Checks

### Page Load
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] Smooth animations

### Sidebar Collapse
- [ ] Smooth transition (300ms)
- [ ] No layout shift
- [ ] GPU-accelerated (check DevTools Performance)

### Video Load
- [ ] Iframe lazy loads
- [ ] No impact on initial page load
- [ ] Video starts buffering when player visible

---

## ✅ Success Criteria

**All tests pass if:**
1. ✅ YouTube video plays successfully
2. ✅ Sidebar collapses/expands smoothly
3. ✅ Progress updates correctly
4. ✅ Responsive on mobile, tablet, desktop
5. ✅ No console errors
6. ✅ Modern UI matches design reference

---

## 📸 Screenshots to Verify

### Desktop View
![Expected: Sidebar on left, video player full-width, modern gradients]

### Mobile View
![Expected: Collapsible sidebar with overlay, compact header]

### Completed Lesson
![Expected: Green checkmark, completion badge, updated progress]

---

## 🔗 Test URLs

```bash
# Main learn page
http://localhost:3000/courses/sample-course-basic/learn

# Specific lesson (if multiple exist)
http://localhost:3000/courses/sample-course-basic/learn?lesson=cmi7ktalj000bum6s7vvmm4fu

# Course detail page (to test enrollment flow)
http://localhost:3000/courses/sample-course-basic
```

---

## 📞 Support

If issues persist:
1. Check browser console for errors
2. Verify Next.js dev server is running
3. Clear browser cache
4. Restart dev server
5. Check `LEARN_PAGE_REDESIGN.md` for details

---

**Happy Testing! 🎉**
