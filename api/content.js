// api/content.js - Serve content to whitelisted IPs
import { content } from './update.js';

export default async function handler(req, res) {
  // This will only be called for whitelisted IPs due to middleware
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(content);
}
