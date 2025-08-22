import { NextResponse } from 'next/server';

export function middleware(req) {
  const whitelistedIPs = ['192.168.1.34', '10.0.0.127'];

  // get client ip
  const ipHeader = req.headers.get('x-forwarded-for') || '';
  const clientIP = ipHeader.split(',')[0].trim();

  // log ip (helps debug in vercel logs)
  console.log('client ip:', clientIP);

  // block if not whitelisted
  if (!whitelistedIPs.includes(clientIP)) {
    return new NextResponse('access denied', {
      status: 403,
      headers: { 'content-type': 'text/plain' }
    });
  }

  // continue normally
  return NextResponse.next();
}

// only run middleware on these paths
export const config = {
  matcher: [
    '/api/:path*',
    '/admin',
    '/',
  ],
};
