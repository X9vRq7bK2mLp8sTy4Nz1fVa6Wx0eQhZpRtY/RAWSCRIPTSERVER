// api/auth.js - Handle admin authentication
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    // Simple authentication - in production, use secure hashing
    if (username === 'admin' && password === 'securepassword') {
      return res.status(200).json({ success: true, token: 'admin-token' });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
