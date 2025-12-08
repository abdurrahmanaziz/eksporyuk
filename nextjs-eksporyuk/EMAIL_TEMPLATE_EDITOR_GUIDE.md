# Email Template Editor - User Guide

## 🎨 Dual Mode Editor

Admin sekarang punya **2 mode** untuk edit template email:

### 1. **Visual Editor** (Mode Default) 
**Untuk admin yang tidak tahu HTML**

✅ **Fitur:**
- WYSIWYG Editor (What You See Is What You Get)
- Toolbar lengkap: Bold, Italic, Underline, Heading, List, Color, dll
- Insert link & gambar dengan mudah
- No coding required!
- Live formatting preview

✅ **Cara Pakai:**
1. Klik tombol **"Visual"** di atas editor
2. Edit seperti Word/Google Docs
3. Untuk insert variabel: ketik manual `{name}` atau klik tombol variabel
4. Format teks dengan toolbar

✅ **Tips:**
- Gunakan Heading 1-3 untuk struktur
- Bold untuk highlight penting
- Bullet list untuk fitur/benefit
- Link button untuk CTA

---

### 2. **HTML Editor** (Mode Advanced)
**Untuk admin yang paham HTML**

✅ **Fitur:**
- Full HTML control
- Monospace font untuk code
- Direct HTML editing
- Custom styling dengan inline CSS

✅ **Cara Pakai:**
1. Klik tombol **"HTML"** di atas editor
2. Edit HTML langsung
3. Gunakan inline CSS untuk styling
4. Insert variabel seperti biasa: `{name}`, `{email}`, dll

✅ **Tips:**
- Gunakan inline CSS (external CSS tidak support di email)
- Test di berbagai email client
- Responsive design: max-width 600px

---

## 🔄 Switch Mode Kapan Saja

Admin bisa **switch mode** kapan saja:
- Visual → HTML: Lihat generated HTML
- HTML → Visual: Render HTML ke visual editor

**Warning:** Switching dari Visual ke HTML bisa hilangkan beberapa custom HTML tags yang tidak didukung editor.

---

## 📝 Variabel yang Tersedia

Klik tombol variabel untuk auto-insert:
- `{name}` - Nama user
- `{email}` - Email user  
- `{amount}` - Total pembayaran
- `{paymentUrl}` - Link pembayaran
- `{timeLeft}` - Waktu tersisa
- `{siteName}` - Nama website
- `{supportEmail}` - Email support

---

## 💡 Best Practices

### Visual Mode:
1. ✅ **Start simple** - Plain text dulu, baru formatting
2. ✅ **Use headings** - Struktur jelas dengan H1, H2, H3
3. ✅ **Bold for emphasis** - Highlight info penting
4. ✅ **Lists for clarity** - Bullet/number untuk fitur
5. ✅ **Link button** - Clear CTA dengan link

### HTML Mode:
1. ✅ **Use tables** - Layout email pakai table, bukan div
2. ✅ **Inline CSS** - All styles inline, no external CSS
3. ✅ **Test everywhere** - Gmail, Outlook, Apple Mail
4. ✅ **Keep it simple** - Hindari fancy CSS
5. ✅ **Mobile first** - Max width 600px

---

## 🚀 Template Examples

### Simple Welcome (Visual Mode):
```
Halo {name}! 👋

Selamat datang di EksporYuk!

Anda sekarang bisa:
• Akses kelas ekspor
• Download template
• Konsultasi mentor

[Mulai Belajar]
```

### Professional Invoice (HTML Mode):
```html
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">Invoice #{invoiceId}</h1>
  <p>Halo <strong>{name}</strong>,</p>
  <p>Total: <strong>Rp {amount}</strong></p>
  <a href="{paymentUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Bayar Sekarang
  </a>
</div>
```

---

## ⚡ Quick Tips

1. **Visual Mode** = Cepat & mudah untuk email sederhana
2. **HTML Mode** = Full control untuk design complex
3. **Preview** = Selalu cek preview sebelum save
4. **Test Send** = Kirim test email ke diri sendiri
5. **Variables** = Pastikan semua variabel terisi dengan benar

---

## 🎯 Workflow Recommended

1. **Draft di Visual Mode** - Buat struktur & konten
2. **Switch ke HTML** - Lihat generated code
3. **Refine di HTML** - Add custom styling jika perlu
4. **Preview** - Cek tampilan di live preview
5. **Test Send** - Kirim ke test email
6. **Launch** - Aktifkan template

Happy templating! 🎉
