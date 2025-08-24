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

async function getAllScripts() {
  try {
    const collection = await connectToDB();
    const scripts = await collection.find({}).toArray();
    return scripts.map(doc => ({
      key: doc._id,
      title: doc.title || 'Untitled',
      content: doc.content || '',
      obfuscate: doc.obfuscate || false
    }));
  } catch (err) {
    console.error('MongoDB get all scripts error:', err.message);
    throw new Error(`Failed to fetch scripts: ${err.message}`);
  }
}

async function getScriptByKey(key) {
  try {
    const collection = await connectToDB();
    const doc = await collection.findOne({ _id: key });
    if (!doc) {
      throw new Error('Script not found');
    }
    console.log('MongoDB document:', doc); // Debug document
    return {
      content: typeof doc.content === 'string' ? doc.content : '',
      obfuscate: typeof doc.obfuscate === 'boolean' ? doc.obfuscate : false
    };
  } catch (err) {
    console.error('MongoDB get script error:', err.message);
    throw new Error(`Failed to fetch script: ${err.message}`);
  }
}

async function saveScript(key, title, content, obfuscate) {
  try {
    const collection = await connectToDB();
    await collection.updateOne(
      { _id: key },
      { $set: { title, content, obfuscate } },
      { upsert: true }
    );
  } catch (err) {
    console.error('MongoDB save error:', err.message);
    throw new Error(`Failed to save script: ${err.message}`);
  }
}

async function deleteScript(key) {
  try {
    const collection = await connectToDB();
    const result = await collection.deleteOne({ _id: key });
    if (result.deletedCount === 0) {
      throw new Error('Script not found');
    }
  } catch (err) {
    console.error('MongoDB delete error:', err.message);
    throw new Error(`Failed to delete script: ${err.message}`);
  }
}

function simpleObfuscate(code) {
  return code.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  const secretKey = req.query.key;
  const expectedKey = process.env.SECRET_KEY;
  const authHeader = req.headers.authorization;
  const expectedAuth = `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`).toString('base64')}`;

  try {
    // Admin: Get all scripts
    if (req.method === 'GET' && !req.headers['header-1'] && authHeader === expectedAuth) {
      const scripts = await getAllScripts();
      console.log('Fetched all scripts');
      return res.status(200).json(scripts);
    }

    // Admin: Save script
    if (req.method === 'POST' && authHeader === expectedAuth) {
      const { key, title, content, obfuscate } = req.body;
      if (!key || !title || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      await saveScript(key, title, content, obfuscate);
      console.log(`Saved script: ${key}`);
      return res.status(200).json({ message: 'Script saved' });
    }

    // Admin: Delete script
    if (req.method === 'DELETE' && req.query.key && authHeader === expectedAuth) {
      await deleteScript(req.query.key);
      console.log(`Deleted script: ${req.query.key}`);
      return res.status(200).json({ message: 'Script deleted' });
    }

    // Public: Get specific script by headers (for both /api/script.lua and /)
    if (req.method === 'GET' && req.headers['header-1'] === 'script') {
      const header2 = req.headers['header-2'];
      const header3 = req.headers['header-3'];
      if (!header2 || !header3) {
        console.log('Blocked - missing headers');
        return res.status(400).send('Missing required headers');
      }
      const key = `${header2}-${header3}`;
      if (secretKey !== expectedKey) {
        console.log('Blocked - invalid secret key');
        return res.status(403).send('Access denied');
      }
      const { content, obfuscate } = await getScriptByKey(key);
      const output = obfuscate ? simpleObfuscate(content) : content;
      res.setHeader('Content-Type', 'text/plain');
      console.log(`Served script: ${key}`);
      return res.status(200).send(output);
    }

    if (authHeader && authHeader !== expectedAuth) {
      console.log('Blocked - invalid admin credentials');
      return res.status(401).send('Invalid admin credentials');
    }

    console.log('Blocked - invalid request');
    return res.status(400).send('Invalid request');
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
