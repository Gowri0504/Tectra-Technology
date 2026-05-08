import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get refresh token from cookie
  const refreshToken = request.cookies.get('refreshToken');

  const publicPaths = ['/login', '/register', '/'];
  const isPublicPath = publicPaths.includes(pathname);

  if (!refreshToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (refreshToken && isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
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
};
