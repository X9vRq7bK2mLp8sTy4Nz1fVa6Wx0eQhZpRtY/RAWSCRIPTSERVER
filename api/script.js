// stores the script text in memory
let scriptText = `print("hello world")`;

export default function handler(req, res) {
  const key = req.query.key;

  if (key !== "YOUR-SECRET-KEY-HERE") {
    res.status(403).send("access denied");
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  res.send(scriptText);
}

// ⚠️ note: this resets if vercel redeploys.
// for persistence use vercel kv/db later.
