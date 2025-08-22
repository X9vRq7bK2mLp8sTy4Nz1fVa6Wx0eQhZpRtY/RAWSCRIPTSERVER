// api/update.js - Handle content updates
// For simplicity, we'll use a global variable - in production, use a database
let content = `-- Sample Roblox script
print("Hello from secure text host!")
game.Players.PlayerAdded:Connect(function(player)
    print(player.Name .. " joined the game")
end)`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { newContent, token } = req.body;
    
    // Simple authentication check
    if (token !== 'admin-token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Update content
    content = newContent;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the content for the content endpoint
export { content };
