'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PostRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const redirectToPost = async () => {
      try {
        const postId = params.id as string
        
        // Fetch post to get author info
        const response = await fetch(`/api/posts/${postId}`)
        
        if (!response.ok) {
          setError('Postingan tidak ditemukan')
          return
        }

        const data = await response.json()
        const post = data.post

        if (!post || !post.author) {
          setError('Postingan tidak ditemukan')
          return
        }

        // Get the hash (comment id) from current URL if exists
        const hash = window.location.hash

        // Determine redirect URL
        let redirectUrl = ''
        
        // Check if post is in a group
        if (post.group) {
          redirectUrl = `/community/${post.group.id}`
        } else {
          // Redirect to author's profile
          // Use username if available, otherwise use user id
          const authorIdentifier = post.author.username || post.author.name?.toLowerCase().replace(/\s+/g, '-') || post.author.id
          redirectUrl = `/${authorIdentifier}`
        }

        // Add hash if exists (for comment redirect)
        if (hash) {
          // Store the comment id in sessionStorage for scroll after page load
          const commentId = hash.replace('#comment-', '')
          sessionStorage.setItem('scrollToComment', commentId)
          sessionStorage.setItem('highlightPost', postId)
        } else {
          sessionStorage.setItem('highlightPost', postId)
        }

        // Redirect to the profile/group page
        router.replace(redirectUrl)
      } catch (err) {
        console.error('Error fetching post:', err)
        setError('Terjadi kesalahan saat memuat postingan')
      }
    }

    redirectToPost()
  }, [params.id, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Mengalihkan ke postingan...</p>
      </div>
    </div>
  )
}
