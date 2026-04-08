import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const { organization_id } = req.query

      let query = supabase
        .from('class')
        .select('*, class_membership!inner(person_id, role)')
        .eq('class_membership.person_id', user.personId)
        .order('created_at', { ascending: false })

      if (organization_id) query = query.eq('organization_id', organization_id as string)

      const { data: classes, error } = await query

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: classes })
    }

    if (req.method === 'POST') {
      const { name, description, organization_id, language_id } = req.body || {}
      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' })
      }

      // Create the class
      const { data: newClass, error: classError } = await supabase
        .from('class')
        .insert({
          name,
          description: description || null,
          organization_id,
          language_id: language_id || null,
          created_by: user.personId,
        })
        .select()
        .single()

      if (classError) throw new Error(classError.message)

      // Auto-add creator as teacher
      await supabase
        .from('class_membership')
        .insert({
          class_id: newClass.id,
          person_id: user.personId,
          role: 'teacher',
        })

      return res.status(201).json({ data: newClass })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
