// Test API endpoint directly
async function testAPI() {
  console.log('🧪 Testing Course API...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/courses/sample-course-basic')
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    
    console.log('✅ API Response received')
    console.log('\n📊 Course Data:')
    console.log(`  - ID: ${data.id}`)
    console.log(`  - Title: ${data.title}`)
    console.log(`  - Modules: ${data.modules?.length || 0}`)
    
    if (data.modules && data.modules.length > 0) {
      console.log('\n📚 First Module:')
      const firstModule = data.modules[0]
      console.log(`  - Title: ${firstModule.title}`)
      console.log(`  - Lessons: ${firstModule.lessons?.length || 0}`)
      
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        console.log('\n🎬 First Lesson:')
        const firstLesson = firstModule.lessons[0]
        console.log(`  - ID: ${firstLesson.id}`)
        console.log(`  - Title: ${firstLesson.title}`)
        console.log(`  - Video URL: ${firstLesson.videoUrl || '(empty)'}`)
        console.log(`  - Has videoUrl: ${!!firstLesson.videoUrl}`)
        
        if (firstLesson.videoUrl) {
          // Test conversion
          const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
            /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
          ]
          
          let embedUrl = null
          for (const pattern of patterns) {
            const match = firstLesson.videoUrl.match(pattern)
            if (match && match[1]) {
              embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`
              break
            }
          }
          
          console.log(`  - Embed URL: ${embedUrl || '(conversion failed)'}`)
          console.log(`  - Can convert: ${!!embedUrl}`)
        }
      }
    }
    
    console.log('\n✅ Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAPI()
