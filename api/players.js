import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req, res) {
    // --- Basic Authentication Check ---
    const authHeader = req.headers.authorization;
    const expectedAuth = `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`).toString('base64')}`;

    if (!authHeader || authHeader !== expectedAuth) {
        return res.status(401).json({ error: 'Unauthorized: Invalid admin credentials' });
    }
    
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const db = await connectToDatabase();
        const playersCollection = db.collection('players');
        
        // Calculate the timestamp for 5 minutes ago
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Fetch active players
        const activePlayers = await playersCollection.find({
            lastSeen: { $gte: fiveMinutesAgo }
        }).sort({ lastSeen: -1 }).toArray();

        // Fetch previous players
        const previousPlayers = await playersCollection.find({
            lastSeen: { $lt: fiveMinutesAgo }
        }).sort({ lastSeen: -1 }).toArray();

        return res.status(200).json({ activePlayers, previousPlayers });

    } catch (err) {
        console.error('Fetch players error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
