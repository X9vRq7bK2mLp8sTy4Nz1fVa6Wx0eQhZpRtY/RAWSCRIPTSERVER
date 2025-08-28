import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
}

const client = new MongoClient(uri);
let dbConnection;

export async function connectToDatabase() {
    if (dbConnection) {
        return dbConnection;
    }
    try {
        await client.connect();
        dbConnection = client.db('lua-server');
        console.log("Successfully connected to MongoDB.");
        return dbConnection;
    } catch (e) {
        console.error("Could not connect to MongoDB", e);
        throw new Error(`Failed to connect to database: ${e.message}`);
    }
}
