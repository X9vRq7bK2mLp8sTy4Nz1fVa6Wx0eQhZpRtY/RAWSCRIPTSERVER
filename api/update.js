let scriptText = `print("hello world")`;

export default async function handler(req, res) {
  // simple auth
  const { user, pass } = req.query;

  if (user !== "admin" || pass !== "changeme") {
    res.status(403).send("forbidden");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("use POST");
    return;
  }

  try {
    const body = await req.json();
    if (!body.text) {
      res.status(400).send("no text provided");
      return;
    }
    scriptText = body.text;
    res.send("script updated successfully");
  } catch (e) {
    res.status(400).send("invalid request");
  }
}
