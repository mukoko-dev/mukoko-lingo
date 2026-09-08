/**
 * Looking a document up by `_id` when the collection's id shape is not settled.
 *
 * Every populated `lingo` collection uses UUID strings for `_id` — `skills`,
 * `moderation_alerts`, `ai_conversations`. `assessments`, `classes` and
 * `assignments` are still empty, and the routes that read them were written
 * against `ObjectId`, so `ObjectId.isValid(uuid)` is false and the lookup
 * quietly returns nothing: no 500, no log, just a null join or a 404 for a
 * document that exists.
 *
 * These helpers try the id as written first (the ecosystem convention) and
 * fall back to an ObjectId only when the string really is one, so a collection
 * seeded either way resolves.
 */

import { ObjectId } from 'mongodb'

/**
 * A 24-character hex string is ambiguous — it is a valid ObjectId *and* a
 * possible string key — so both candidates are returned, string first.
 */
export function idCandidates(id: string): (string | ObjectId)[] {
  const candidates: (string | ObjectId)[] = [id]
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
    candidates.push(new ObjectId(id))
  }
  return candidates
}

/** `{ _id: <id> }` filter that matches either shape. */
export function idFilter(id: string): Record<string, unknown> {
  const candidates = idCandidates(id)
  return candidates.length === 1 ? { _id: candidates[0] } : { _id: { $in: candidates } }
}

/** `{ _id: { $in: [...] } }` filter for a batch, covering both shapes. */
export function idsFilter(ids: string[]): Record<string, unknown> {
  const candidates = ids.flatMap((id) => idCandidates(id))
  return { _id: { $in: candidates } }
}

/** Find one document by id, whichever shape its `_id` uses. */
export async function findById<T>(
  collection: { findOne: (filter: any) => Promise<T | null> },
  id: string
): Promise<T | null> {
  if (typeof id !== 'string' || !id) return null
  return collection.findOne(idFilter(id) as any)
}
