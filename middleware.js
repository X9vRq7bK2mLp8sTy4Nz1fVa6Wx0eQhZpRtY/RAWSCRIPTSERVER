export default function middleware(req) {
  const whitelistedIPs = ['192.168.1.34', '10.0.0.127']; // Your whitelisted IPs
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
