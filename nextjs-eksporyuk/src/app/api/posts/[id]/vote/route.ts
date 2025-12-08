import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// POST /api/posts/[id]/vote - Vote on poll
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { optionIndex } = await req.json()

    if (optionIndex === undefined) {
      return NextResponse.json(
        { error: 'Option index is required' },
        { status: 400 }
      )
    }

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post || post.type !== 'POLL') {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    const metadata = post.metadata ? JSON.parse(post.metadata as string) : {}
    const votes = metadata.votes || {}

    // Check if user already voted
    const userVote = votes[session.user.id]
    
    if (userVote !== undefined) {
      // Remove old vote
      const oldOption = `option_${userVote}`
      if (metadata[oldOption + '_votes']) {
        metadata[oldOption + '_votes']--
      }
    }

    // Add new vote
    votes[session.user.id] = optionIndex
    const optionKey = `option_${optionIndex}_votes`
    metadata[optionKey] = (metadata[optionKey] || 0) + 1
    metadata.votes = votes

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })

    return NextResponse.json({ 
      post: updatedPost,
      message: 'Vote recorded successfully' 
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}
