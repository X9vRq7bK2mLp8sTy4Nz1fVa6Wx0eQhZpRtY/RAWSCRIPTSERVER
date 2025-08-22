export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  return res.status(404).send('Endpoint not found. Use /content?key=ROBLOX_SECRET_2024 to access content.');
}
