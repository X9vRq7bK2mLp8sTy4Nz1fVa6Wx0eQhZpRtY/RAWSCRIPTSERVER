export default function handler(req, res) {
  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (username === expectedUsername && password === expectedPassword) {
    return res.status(200).json({ message: 'Login successful' });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
}
