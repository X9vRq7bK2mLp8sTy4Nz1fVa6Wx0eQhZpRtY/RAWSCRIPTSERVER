// File: api/players-public.js
import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const db = await connectToDatabase();
        const playersCollection = db.collection('players');
        
        // Calculate timestamp for 5 minutes ago
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Fetch active players (lastSeen within 5 minutes)
        const activePlayers = await playersCollection
            .find({ lastSeen: { $gte: fiveMinutesAgo } }, { projection: { username: 1, displayName: 1, _id: 0 } })
            .sort({ lastSeen: -1 })
            .toArray();

        // Fetch previous players (lastSeen older than 5 minutes)
        const previousPlayers = await playersCollection
            .find({ lastSeen: { $lt: fiveMinutesAgo } }, { projection: { username: 1, displayName: 1, _id: 0 } })
            .sort({ lastSeen: -1 })
            .toArray();

        return res.status(200).json({ activePlayers, previousPlayers });
    } catch (err) {
        console.error('Fetch public players error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
