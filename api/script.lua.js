let scriptContent = `print("Hello from the Lua script!")\nlocal player = game.Players.LocalPlayer\nif player then\n  print("Player name: " .. player.Name)\nend`;
let obfuscate = false;

function simpleObfuscate(code) {
  return code.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

export default function handler(req, res) {
  const secretKey = req.query.key;
  const expectedKey = process.env.SECRET_KEY;
  const authHeader = req.headers.authorization;
  const expectedAuth = `Basic ${btoa(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`)}`;

  // Log every request
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    secretKey,
    expectedKey,
    authHeader
  });

  try {
    if (req.method === 'POST' && authHeader === expectedAuth) {
      scriptContent = req.body.content || scriptContent;
      obfuscate = req.body.obfuscate === 'true' || req.body.obfuscate === true;
      console.log('POST successful, updated script:', { content: scriptContent, obfuscate });
      return res.status(200).json({ message: 'Script updated' });
    }

    if (req.method === 'GET' && authHeader === expectedAuth) {
      console.log('Admin GET successful');
      return res.status(200).json({ content: scriptContent, obfuscate });
    }

    if (authHeader && authHeader !== expectedAuth) {
      console.log('Invalid auth header:', authHeader);
      return res.status(401).send('Invalid admin credentials');
    }

    if (secretKey !== expectedKey) {
      console.log('Invalid secret key:', secretKey, 'Expected:', expectedKey);
      return res.status(403).send('access denied');
    }

    const output = obfuscate ? simpleObfuscate(scriptContent) : scriptContent;
    console.log('Serving script:', output);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(output);
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).send(`Server error: ${err.message}`);
  }
}
