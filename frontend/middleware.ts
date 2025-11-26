import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto')
    
    if (protocol === 'http') {
      const url = request.url.replace('http://', 'https://')
      return NextResponse.redirect(url, 301)
    }
    
    // Ensure correct domain for production
    const host = request.headers.get('host')
    if (host && !host.includes('www.sekagestion.com') && !host.includes('localhost')) {
      const url = new URL(request.url)
      url.host = 'www.sekagestion.com'
      return NextResponse.redirect(url.toString(), 301)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}