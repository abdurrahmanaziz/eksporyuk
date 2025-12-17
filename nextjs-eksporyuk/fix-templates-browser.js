// Script untuk fix template types di browser console
// Jalankan di browser saat sudah login sebagai admin

async function fixTemplateTypes() {
  try {
    console.log('Fixing template types...')
    
    const response = await fetch('/api/admin/fix-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Success:', result.message)
      console.log('📋 Templates:', result.templates)
      
      // Tampilkan hasil dalam format yang mudah dibaca
      console.table(result.templates.map(t => ({
        Name: t.name,
        Type: t.type,
        Active: t.isActive,
        Category: t.category
      })))
      
      alert('Template types berhasil diperbaiki! Refresh halaman untuk melihat perubahan.')
      
    } else {
      console.error('❌ Error:', result.error)
      alert('Error: ' + result.error)
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error)
    alert('Network error: ' + error.message)
  }
}

// Jalankan fungsi
fixTemplateTypes()