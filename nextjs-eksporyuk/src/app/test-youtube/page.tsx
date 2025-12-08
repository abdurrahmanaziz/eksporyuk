'use client'

export default function TestYouTubePage() {
  const testVideoUrl = 'https://youtu.be/sDJFbpMzyIU'
  const embedUrl = `https://www.youtube.com/embed/sDJFbpMzyIU?autoplay=0&rel=0&modestbranding=1`

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">YouTube Embed Test</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Original URL:</h2>
          <code className="bg-gray-800 p-2 rounded block">{testVideoUrl}</code>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Embed URL:</h2>
          <code className="bg-gray-800 p-2 rounded block">{embedUrl}</code>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Video Player:</h2>
          <div className="relative bg-black">
            <div className="aspect-video w-full max-w-4xl">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Test YouTube Video"
                style={{ border: 0 }}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">✅ Checklist:</h3>
          <ul className="space-y-2 text-sm">
            <li>• Apakah video player muncul?</li>
            <li>• Apakah ada loading spinner YouTube?</li>
            <li>• Apakah bisa di-klik play?</li>
            <li>• Apakah video bisa diputar?</li>
            <li>• Apakah ada error di console?</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
