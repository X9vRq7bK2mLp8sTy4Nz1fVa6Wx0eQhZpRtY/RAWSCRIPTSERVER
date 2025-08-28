import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const { username, displayName, avatar } = req.body;

        if (!username || !displayName || !avatar) {
            return res.status(400).json({ error: 'Missing required fields: username, displayName, avatar' });
        }

        const db = await connectToDatabase();
        const playersCollection = db.collection('players');
        const now = new Date();

        await playersCollection.updateOne(
            { username: username },
            {
                $set: {
                    displayName: displayName,
                    avatar: avatar,
                    lastSeen: now
                },
                $setOnInsert: {
                    username: username,
                    firstSeen: now
                }
            },
            { upsert: true }
        );

        return res.status(200).json({ message: 'Player ping successful' });

    } catch (err) {
        console.error('Player ping error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
