/**
 * Resolving whatever a caller calls a skill to a `skills._id`.
 *
 * `user_skills.skill_id` holds a `skills._id` UUID, which `tutor-prompt.ts`
 * and `api/skills/user.ts` join back to a name; the question bank labels
 * skills by name (`vocabulary`). A name written into that column produces a
 * row every reader silently ignores, so both spellings are accepted and
 * resolved before anything is written.
 *
 * Shared by `/api/assessments/start` and `/api/assessments/submit` so the two
 * cannot disagree about which row a learner's score belongs to.
 */

export interface SkillLookupCollection {
  find: (filter: any) => { toArray: () => Promise<any[]> }
}

/** Map of the values asked for → `skills._id`. Unknown values are absent. */
export async function resolveSkillIds(
  skillsCol: SkillLookupCollection,
  values: string[]
): Promise<Map<string, string>> {
  const wanted = Array.from(new Set(values.filter(Boolean)))
  if (wanted.length === 0) return new Map()

  const docs = await skillsCol.find({ $or: [{ _id: { $in: wanted } }, { name: { $in: wanted } }] }).toArray()

  const byValue = new Map<string, string>()
  for (const doc of docs) {
    const id = String(doc._id)
    if (wanted.includes(id)) byValue.set(id, id)
    if (typeof doc.name === 'string' && wanted.includes(doc.name)) byValue.set(doc.name, id)
  }
  return byValue
}

/**
 * The skill *name* for a value that may be a name or a `skills._id`.
 *
 * The question bank selects on names, so a client sending a UUID needs it
 * translated before any questions can be chosen.
 */
export async function resolveSkillName(
  skillsCol: SkillLookupCollection,
  value: string
): Promise<string | null> {
  if (!value) return null
  const docs = await skillsCol.find({ $or: [{ _id: value }, { name: value }] }).toArray()
  const doc = docs[0]
  if (!doc || typeof doc.name !== 'string') return null
  return doc.name
}
