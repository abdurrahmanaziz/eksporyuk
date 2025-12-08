// Test YouTube URL conversion
function getYouTubeEmbedUrl(url) {
  if (!url) return null
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`
    }
  }
  
  return null
}

// Test cases
const testUrls = [
  'https://youtu.be/sDJFbpMzyIU',
  'https://www.youtube.com/watch?v=sDJFbpMzyIU',
  'https://youtube.com/watch?v=sDJFbpMzyIU',
  'https://www.youtube.com/embed/sDJFbpMzyIU',
  'https://example.com/video.mp4',
]

console.log('🧪 Testing YouTube URL Conversion:\n')

testUrls.forEach(url => {
  const result = getYouTubeEmbedUrl(url)
  console.log(`Input:  ${url}`)
  console.log(`Output: ${result || '❌ Not a YouTube URL'}`)
  console.log('')
})
