// Import the shared content
import { content } from './update.js';

// Secret key - change this to something unique
const SECRET_KEY = "ROBLOX_SECRET_2024";

// Paths that should NOT require a key
const PUBLIC_PATHS = ['/public/', '/admin', '/panel'];

export default async function handler(req, res) {
  const url = req.url || '';
  
  // Check if this is a public path that shouldn't require a key
  const isPublicPath = PUBLIC_PATHS.some(path => url.includes(path));
  
  if (isPublicPath) {
    // For public paths, don't handle them here - let Vercel routing work
    res.setHeader('Content-Type', 'text/plain');
    return res.status(404).send('Not found - this should be handled by Vercel routing');
  }
  
  // Get the key from query parameters
  const { key } = req.query;
  
  // Check if the key matches
  if (key !== SECRET_KEY) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(403).send('Access Denied: Invalid key');
  }
  
  // Set headers to prevent HTML rendering
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Valid key - serve the content
  return res.status(200).send(content);
}
