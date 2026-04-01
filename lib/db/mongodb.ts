import { MongoClient, type Db } from 'mongodb';

const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || 'careerorbit_portal';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }
  return uri;
}

type GlobalMongo = typeof globalThis & {
  __careerorbitMongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  const g = globalThis as GlobalMongo;
  if (!g.__careerorbitMongoClientPromise) {
    const client = new MongoClient(getMongoUri(), {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    g.__careerorbitMongoClientPromise = client.connect().catch((error) => {
      // If initial connect fails (TLS/network/selection), allow next request to retry.
      g.__careerorbitMongoClientPromise = undefined;
      throw error;
    });
  }
  return g.__careerorbitMongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
