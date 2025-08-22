// Simple admin endpoint that redirects to the HTML file
export default async function handler(req, res) {
  // Return a simple HTML page with a redirect
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting to Admin Panel</title>
        <meta http-equiv="refresh" content="0; url=/public/admin.html" />
    </head>
    <body>
        <p>Redirecting to <a href="/public/admin.html">admin panel</a>...</p>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}
