let scriptText = `print("hello world")`;

export default function handler(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0];
  const allowedIp = "your.real.ip.address"; // hardcode your device ip here
  const user = req.query.user;
  const pass = req.query.pass;
  const newText = req.body?.text;

  if (ip !== allowedIp || user !== "yourusername" || pass !== "yourpassword") {
    res.status(403).send("forbidden");
    return;
  }

  if (!newText) {
    res.status(400).send("no text provided");
    return;
  }

  scriptText = newText; // updates the live script

  res.send("script updated");
}
