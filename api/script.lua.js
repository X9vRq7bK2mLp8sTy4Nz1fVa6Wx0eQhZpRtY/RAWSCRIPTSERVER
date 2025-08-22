const { MongoClient } = require('mongodb');
const luamin = require('luamin');

export default async function handler(req, res) {
  const secretKey = req.query.key;
  const expectedKey = process.env.SECRET_KEY; // 250-character secret key

  if (secretKey !== expectedKey) {
    return res.status(403).send('access denied');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('lua_app');
    const collection = db.collection('scripts');
    const scriptDoc = await collection.findOne({ name: 'main_script' });

    if (!scriptDoc) {
      return res.status(404).send('Script not found');
    }

    const script = scriptDoc.obfuscate ? luamin.minify(scriptDoc.content) : scriptDoc.content;
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(script);
  } catch (error) {
    return res.status(500).send('Server error');
  } finally {
    await client.close();
  }
}
