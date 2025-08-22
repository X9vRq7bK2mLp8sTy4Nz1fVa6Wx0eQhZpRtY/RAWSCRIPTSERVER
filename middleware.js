import { NextResponse } from 'next/server';

export function middleware(req) {
  const whitelistedIPs = ['192.168.1.34', '10.0.0.127'];
  
  // vercel gives ip like this
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '';

  // allow only whitelisted ips
  if (!whitelistedIPs.includes(clientIP)) {
    return new NextResponse('access denied', { status: 403 });
  }

  return NextResponse.next();
}
