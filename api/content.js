// Import the shared content
import { content } from './update.js';

// Secret key - change this to something unique
const SECRET_KEY = "ROBLOX_SECRET_2024";

export default async function handler(req, res) {
  // Get the key from query parameters
  const { key } = req.query;
  
  // Check if the key matches
  if (key !== SECRET_KEY) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(403).send('Access Denied: Invalid key');
  }
  
  // Valid key - serve the content
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(content);
}
