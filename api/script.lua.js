const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not defined in environment variables');
  throw new Error('MONGO_URI is not defined');
}
const client = new MongoClient(uri);
let db; // Cached DB connection

async function connectToDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db('lua-server');
    }
    return db.collection('scripts');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw new Error(`Failed to connect to database: ${err.message}`);
  }
}

async function getScriptFromDB() {
  try {
    const collection = await connectToDB();
    let doc = await collection.findOne({ _id: 'main-script' });
    if (!doc) {
      const defaultContent = `print("Hello from the Lua script!")\nlocal player = game.Players.LocalPlayer\nif player then\n  print("Player name: " .. player.Name)\nend`;
      doc = { _id: 'main-script', content: defaultContent, obfuscate: false };
      await collection.insertOne(doc);
    }
    return doc;
  } catch (err) {
    console.error('MongoDB get error:', err.message);
    throw new Error(`Failed to fetch script: ${err.message}`);
  }
}

async function updateScriptInDB(content, obfuscate) {
  try {
    const collection = await connectToDB();
    await collection.updateOne(
      { _id: 'main-script' },
      { $set: { content, obfuscate } },
      { upsert: true }
    );
  } catch (err) {
    console.error('MongoDB update error:', err.message);
    throw new Error(`Failed to update script: ${err.message}`);
  }
}

function simpleObfuscate(code) {
  return code.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  const secretKey = req.query.key;
  const expectedKey = process.env.SECRET_KEY;
  const authHeader = req.headers.authorization;
  const expectedAuth = `Basic ${btoa(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`)}`;

  try {
    if (req.method === 'POST' && authHeader === expectedAuth) {
      const { content, obfuscate: newObfuscate } = req.body;
      await updateScriptInDB(content || '', newObfuscate === true || newObfuscate === 'true');
      return res.status(200).json({ message: 'Script updated' });
    }

    if (req.method === 'GET' && authHeader === expectedAuth) {
      const { content, obfuscate } = await getScriptFromDB();
      return res.status(200).json({ content, obfuscate });
    }

    if (authHeader && authHeader !== expectedAuth) {
      return res.status(401).send('Invalid admin credentials');
    }

    if (secretKey !== expectedKey) {
      return res.status(403).send('access denied');
    }

    const { content, obfuscate } = await getScriptFromDB();
    const output = obfuscate ? simpleObfuscate(content) : content;
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(output);
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
