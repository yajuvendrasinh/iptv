import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Missing target url', { status: 400 });
    }

    // Forward the request to the target stream URL
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      return new Response(`Target returned status ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || '';
    
    // If it's an M3U8 playlist text file, parse and rewrite relative URLs
    if (contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || targetUrl.includes('.m3u8')) {
      const text = await res.text();
      
      // Calculate baseUrl and parentUrl to resolve relative URLs
      const targetUrlObj = new URL(targetUrl);
      const baseUrl = targetUrlObj.origin;
      const parentUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        let absoluteUrl = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          if (trimmed.startsWith('/')) {
            absoluteUrl = baseUrl + trimmed;
          } else {
            absoluteUrl = parentUrl + trimmed;
          }
        }

        // Return the URL rewritten to go through our proxy
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      });

      return new Response(rewrittenLines.join('\n'), {
        headers: {
          'Content-Type': 'application/x-mpegURL',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    } 
    // If it's binary data (video segments), stream it directly
    else {
      const body = res.body;
      return new Response(body, {
        headers: {
          'Content-Type': contentType || 'video/MP2T',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
  } catch (error: any) {
    console.error('Streaming proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
