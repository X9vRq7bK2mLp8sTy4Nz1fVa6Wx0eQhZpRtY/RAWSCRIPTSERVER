import { connectToDatabase } from '../lib/mongodb';

// A session is considered expired if the last ping was more than 5 minutes ago
const SESSION_EXPIRATION_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        // Destructure all expected fields from the body
        const { username, displayName, avatar, executorName } = req.body;

        if (!username || !displayName || !avatar) {
            return res.status(400).json({ error: 'Missing required fields: username, displayName, avatar' });
        }

        const db = await connectToDatabase();
        const playersCollection = db.collection('players');
        const now = new Date();

        // Find the existing player document to check their lastSeen status
        const existingPlayer = await playersCollection.findOne({ username: username });

        let sessionStartTime = now;
        // If the player exists and was seen recently, keep their current session start time
        if (existingPlayer && (now.getTime() - new Date(existingPlayer.lastSeen).getTime()) < SESSION_EXPIRATION_MS) {
            sessionStartTime = existingPlayer.sessionStart; // Preserve the existing session start time
        }
        // If the player exists but was not seen recently, or if they don't exist,
        // sessionStartTime will be `now`, starting a new session.

        await playersCollection.updateOne(
            { username: username },
            {
                $set: {
                    displayName: displayName,
                    avatar: avatar,
                    lastSeen: now,
                    sessionStart: sessionStartTime, // Set or update the session start time
                    executorName: executorName || "Unknown", // Save executor name, default to "Unknown"
                },
                $setOnInsert: {
                    username: username,
                    firstSeen: now, // This only sets when the document is first created
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
