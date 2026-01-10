'use client'

export default function TestVideoDirectPage() {
  const testVideo = {
    id: 'test-1',
    title: 'Test Video - Hardcoded',
    videoUrl: 'https://youtu.be/sDJFbpMzyIU'
  }

  // Convert function
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

  const embedUrl = getYouTubeEmbedUrl(testVideo.videoUrl)

  console.log('🎥 DIRECT TEST:', {
    originalUrl: testVideo.videoUrl,
    embedUrl: embedUrl,
    hasEmbedUrl: !!embedUrl
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Video - Direct Render</h1>
      
      <div className="space-y-6 max-w-4xl">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-2">Debug Info:</h2>
          <pre className="text-sm text-gray-300 overflow-auto">
{JSON.stringify({
  title: testVideo.title,
  videoUrl: testVideo.videoUrl,
  embedUrl: embedUrl,
  hasEmbedUrl: !!embedUrl
}, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl mb-4">Video Player (Direct Render):</h2>
          <div className="relative bg-black">
            <div className="aspect-video w-full">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={testVideo.title}
                  frameBorder="0"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-red-400">
                  No embed URL generated
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded p-4">
          <p className="text-green-300">
            ✅ Jika video muncul di atas, berarti iframe berfungsi!
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Masalah ada di data fetching di halaman learn.
          </p>
        </div>

        <div className="bg-red-900/20 border border-red-700 rounded p-4">
          <p className="text-red-300">
            ❌ Jika video TIDAK muncul, berarti ada masalah di browser/CSP.
          </p>
        </div>
      </div>
    </div>
  )
}
