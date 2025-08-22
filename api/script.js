let scriptText = `print("hello world")`; // default content stored in memory

export default function handler(req, res) {
  const key = req.query.key;

  if (key !== "your-250-char-secret-key") {
    res.status(403).send("forbidden");
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  res.send(scriptText);
}

// this lets roblox (or anything) fetch the code directly as plain text
// url example: https://yourproject.vercel.app/api/script?key=your-250-char-secret-key
