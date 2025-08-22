const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send('Unauthorized');

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).send('Invalid token');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('lua_app');
    const collection = db.collection('scripts');

    if (req.method === 'GET') {
      const scriptDoc = await collection.findOne({ name: 'main_script' });
      return res.status(200).json(scriptDoc || { content: '', obfuscate: false });
    } else if (req.method === 'POST') {
      const { content, obfuscate } = req.body;
      await collection.updateOne(
        { name: 'main_script' },
        { $set: { content, obfuscate } },
        { upsert: true }
      );
      return res.status(200).send('Script updated');
    }
  } catch (error) {
    return res.status(500).send('Server error');
  } finally {
    await client.close();
  }
}
