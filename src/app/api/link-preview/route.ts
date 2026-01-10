import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EksporYuk/1.0; +https://eksporyuk.com)',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Extract meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
                           html.match(/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    const imageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
                      html.match(/<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    const siteNameMatch = html.match(/<meta[^>]*property=["\']og:site_name["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    
    return {
      title: titleMatch?.[1]?.trim(),
      description: descriptionMatch?.[1]?.trim(),
      image: imageMatch?.[1]?.trim(),
      url,
      siteName: siteNameMatch?.[1]?.trim(),
    };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
}

function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match?.[1] || null;
}

function isYouTubeURL(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    // Handle YouTube URLs specially
    if (isYouTubeURL(url)) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return NextResponse.json({
          success: true,
          preview: {
            title: `YouTube Video`,
            description: 'Click to watch on YouTube',
            image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            url,
            siteName: 'YouTube',
            type: 'video',
            videoId,
          },
        });
      }
    }
    
    // Fetch general link preview
    const preview = await fetchLinkPreview(url);
    
    if (!preview) {
      return NextResponse.json({ error: 'Could not fetch preview' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error generating link preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}