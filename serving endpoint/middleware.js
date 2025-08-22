// middleware.js - IP-based access control
export default function middleware(req) {
  const whitelistedIPs = ['156.155.21.186', '10.0.0.127']; // Your whitelisted IPs
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Allow access to API endpoints and admin panel for whitelisted IPs
  if (req.url.startsWith('/api/') || req.url === '/admin.html') {
    if (!whitelistedIPs.includes(clientIP)) {
      return new Response('Access Denied', { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
  
  // For all other requests, serve content if IP is whitelisted
  if (!whitelistedIPs.includes(clientIP)) {
    return new Response('Access Denied', { 
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
