import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // No auth - redirect root to dashboard
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
