const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not defined');
  throw new Error('MONGO_URI is not defined');
}
const client = new MongoClient(uri);
let db;

async function connectToDB(collectionName = 'scripts') {
  try {
    if (!db) {
      await client.connect();
      db = client.db('lua-server');
    }
    return db.collection(collectionName);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw new Error(`Failed to connect to database: ${err.message}`);
  }
}

async function getScriptByKey(key) {
  try {
    const collection = await connectToDB('scripts');
    const doc = await collection.findOne({ _id: key });
    console.log(`MongoDB query for key ${key}:`, doc);
    if (!doc) {
      console.error(`Script not found for key: ${key}`);
      throw new Error('Script not found');
    }
    if (typeof doc.content !== 'string' || !doc.content) {
      console.warn(`Invalid or empty content for key ${key}, defaulting to empty string`);
    }
    return {
      content: typeof doc.content === 'string' ? doc.content : '',
      obfuscate: typeof doc.obfuscate === 'boolean' ? doc.obfuscate : false
    };
  } catch (err) {
    console.error('MongoDB get script error:', err.message);
    throw new Error(`Failed to fetch script: ${err.message}`);
  }
}

async function getAllScripts() {
  try {
    const collection = await connectToDB('scripts');
    const scripts = await collection.find({}).toArray();
    return scripts.map(doc => ({
      key: doc._id,
      title: doc.title || 'Untitled',
      content: typeof doc.content === 'string' ? doc.content : '',
      obfuscate: typeof doc.obfuscate === 'boolean' ? doc.obfuscate : false
    }));
  } catch (err) {
    console.error('MongoDB get all scripts error:', err.message);
    throw new Error(`Failed to fetch scripts: ${err.message}`);
  }
}

async function saveScript(key, title, content, obfuscate) {
  try {
    const collection = await connectToDB('scripts');
    if (!content.trim()) {
      console.error('Script content cannot be empty');
      throw new Error('Script content cannot be empty');
    }
    await collection.updateOne(
      { _id: key },
      { $set: { title, content, obfuscate } },
      { upsert: true }
    );
    console.log(`Saved script: ${key}`);
  } catch (err) {
    console.error('MongoDB save error:', err.message);
    throw new Error(`Failed to save script: ${err.message}`);
  }
}

async function deleteScript(key) {
  try {
    const collection = await connectToDB('scripts');
    const result = await collection.deleteOne({ _id: key });
    if (result.deletedCount === 0) {
      throw new Error('Script not found');
    }
    console.log(`Deleted script: ${key}`);
  } catch (err) {
    console.error('MongoDB delete error:', err.message);
    throw new Error(`Failed to delete script: ${err.message}`);
  }
}

async function pingPlayer({ username, displayName, avatar }) {
  try {
    const collection = await connectToDB('players');
    const now = new Date();
    const existingPlayer = await collection.findOne({ username });
    
    if (existingPlayer) {
      await collection.updateOne(
        { username },
        { $set: { lastSeen: now, displayName, avatar } }
      );
      console.log(`Updated player ping: ${username}`);
    } else {
      await collection.insertOne({
        username,
        displayName,
        avatar,
        firstSeen: now,
        lastSeen: now
      });
      console.log(`Added new player: ${username}`);
    }
    return { message: 'Ping recorded' };
  } catch (err) {
    console.error('MongoDB player ping error:', err.message);
    throw new Error(`Failed to record ping: ${err.message}`);
  }
}

async function getPlayers() {
  try {
    const collection = await connectToDB('players');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const players = await collection.find({}).toArray();
    
    const activePlayers = players.filter(p => p.lastSeen >= fiveMinutesAgo);
    const previousPlayers = players.filter(p => p.lastSeen < fiveMinutesAgo);
    
    return {
      activePlayers: activePlayers.map(p => ({
        username: p.username,
        displayName: p.displayName,
        avatar: p.avatar,
        firstSeen: p.firstSeen,
        lastSeen: p.lastSeen
      })),
      previousPlayers: previousPlayers.map(p => ({
        username: p.username,
        displayName: p.displayName,
        avatar: p.avatar,
        firstSeen: p.firstSeen,
        lastSeen: p.lastSeen
      }))
    };
  } catch (err) {
    console.error('MongoDB get players error:', err.message);
    throw new Error(`Failed to fetch players: ${err.message}`);
  }
}

function simpleObfuscate(code) {
  return code.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const expectedAuth = `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`).toString('base64')}`;
  const scriptId = req.params?.scriptid || req.query?.scriptid;

  console.log(`Received request: ${req.method} ${req.url}`);

  try {
    if (req.method === 'POST' && req.url === '/api/player-ping') {
      const { username, displayName, avatar } = req.body;
      if (!username || !displayName || !avatar) {
        console.log('Blocked - missing required player fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      await pingPlayer({ username, displayName, avatar });
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ message: 'Ping recorded' });
    }

    if (req.method === 'GET' && req.url === '/api/players' && authHeader === expectedAuth) {
      const players = await getPlayers();
      console.log('Fetched all players');
      return res.status(200).json(players);
    }

    if (req.method === 'GET' && scriptId) {
      console.log(`Handling GET /api/script.lua/${scriptId}`);
      const { content, obfuscate } = await getScriptByKey(scriptId);
      if (!content) {
        console.warn(`No content for script: ${scriptId}`);
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('No script content found');
      }
      const output = obfuscate ? simpleObfuscate(content) : content;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Access-Control-Allow-Origin', '*');
      console.log(`Served raw script: ${scriptId} (obfuscated: ${obfuscate})`);
      return res.status(200).send(output);
    }

    if (req.method === 'GET' && !scriptId && !req.query.key && authHeader === expectedAuth) {
      const scripts = await getAllScripts();
      console.log('Fetched all scripts');
      return res.status(200).json(scripts);
    }

    if (req.method === 'GET' && req.query.key && authHeader === expectedAuth) {
      const { content, obfuscate } = await getScriptByKey(req.query.key);
      console.log(`Served script for edit: ${req.query.key}`);
      return res.status(200).json({ content, obfuscate });
    }

    if (req.method === 'POST' && authHeader === expectedAuth) {
      const { key, title, content, obfuscate } = req.body;
      if (!key || !title || !content) {
        console.log('Blocked - missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      await saveScript(key, title, content, obfuscate);
      console.log(`Saved script: ${key}`);
      return res.status(200).json({ message: 'Script saved' });
    }

    if (req.method === 'DELETE' && req.query.key && authHeader === expectedAuth) {
      await deleteScript(req.query.key);
      console.log(`Deleted script: ${req.query.key}`);
      return res.status(200).json({ message: 'Script deleted' });
    }

    if (authHeader && authHeader !== expectedAuth) {
      console.log('Blocked - invalid admin credentials');
      return res.status(401).send('Invalid admin credentials');
    }

    console.log('Blocked - invalid request');
    return res.status(400).send('Invalid request');
  } catch (err) {
    console.error('Handler error:', err.message);
    if (req.method === 'GET' && scriptId) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(404).send(`Script not found: ${err.message}`);
    }
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
