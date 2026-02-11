/**
 * MongoDB Client Connection
 * Server-side only - used by API routes / Vercel serverless functions
 *
 * Uses the native MongoDB driver with Vercel Functions pool management.
 * For data modeling, use Prisma Client (see prisma/schema.prisma).
 */

import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {
  appName: 'mukoko-lingo',
  maxIdleTimeMS: 5000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production, create a new client
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

/**
 * Get the MongoDB database instance
 */
export async function getDatabase(dbName: string = 'mukoko-lingo') {
  const client = await clientPromise
  return client.db(dbName)
}

/**
 * Get a MongoDB collection
 */
export async function getCollection<T extends Document>(
  collectionName: string,
  dbName: string = 'mukoko-lingo'
) {
  const db = await getDatabase(dbName)
  return db.collection<T>(collectionName)
}
