import { NextResponse } from 'next/server';

export function middleware(req) {
  // allow all requests, no restrictions
  return NextResponse.next();
}

// apply to all routes
export const config = {
  matcher: ['/:path*'],
};
