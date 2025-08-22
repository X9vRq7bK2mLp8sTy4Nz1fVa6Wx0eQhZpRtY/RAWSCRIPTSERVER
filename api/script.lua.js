let scriptContent = `print("Hello from the Lua script!")\nlocal player = game.Players.LocalPlayer\nif player then\n  print("Player name: " .. player.Name)\nend`;
let obfuscate = false;

function simpleObfuscate(code) {
  return code.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

export default function handler(req, res) {
  const secretKey = req.query.key;
  const expectedKey = process.env.SECRET_KEY;
  const authHeader = req.headers.authorization;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (req.method === 'POST' && authHeader === `Basic ${btoa(``\({adminUsername}:\)`{adminPassword}`)}`) {
    scriptContent = req.body.content || scriptContent;
    obfuscate = req.body.obfuscate === 'true' || req.body.obfuscate === true;
    return res.status(200).json({ message: 'Script updated' });
  }

  if (req.method === 'GET' && authHeader === `Basic ${btoa(``\({adminUsername}:\)`{adminPassword}`)}`) {
    return res.status(200).json({ content: scriptContent, obfuscate });
  }

  if (secretKey !== expectedKey) {
    return res.status(403).send('access denied');
  }

  const output = obfuscate ? simpleObfuscate(scriptContent) : scriptContent;
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(output);
}
