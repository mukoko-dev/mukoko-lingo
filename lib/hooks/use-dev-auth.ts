"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { isDevMode, DEV_USER } from "@/lib/dev-mode"
import type { User } from "@supabase/supabase-js"

export function useDevAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      if (isDevMode()) {
        setUser(DEV_USER as unknown as User)
        setIsLoading(false)
        return
      }

      const {
        data: { user: realUser },
      } = await supabase.auth.getUser()

      setUser(realUser)
      setIsLoading(false)
    }

    getUser()

    if (!isDevMode()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase.auth])

  return { user, isLoading }
}
