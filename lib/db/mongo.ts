/**
 * MongoDB Client Singleton
 * Server-side only — used by API routes / Vercel serverless functions.
 *
 * Cached across warm Vercel invocations the same way the Python analytics
 * scripts cache their MongoClient (api/analytics/_helpers.py's `_client`
 * global) — but promise-cached here since `MongoClient.connect()` is async
 * and two concurrent cold-start requests must not race into creating two
 * separate clients/pools.
 */

import { MongoClient, type Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const DB_NAME = 'mukoko-lingo'

if (!MONGODB_URI) {
  console.error('[mukoko][db] Missing credentials: MONGODB_URI must be set')
}

let _client: MongoClient | null = null
let _clientPromise: Promise<MongoClient> | null = null

async function getClient(): Promise<MongoClient> {
  if (_client) return _client
  if (!_clientPromise) {
    _clientPromise = new MongoClient(MONGODB_URI, { appName: 'mukoko-api' }).connect()
  }
  _client = await _clientPromise
  return _client
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(DB_NAME)
}
