import { createServerClient as createServerClientBase } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isDevMode, DEV_USER } from "@/lib/dev-mode"
import type { User } from "@supabase/supabase-js"

// This is correct behavior for server-side code
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClientBase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function createServerClient() {
  const cookieStore = await cookies()

  return createServerClientBase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Server-side helper to get user with dev mode support
export async function getUser(): Promise<User | null> {
  // In dev mode, return mock user
  if (isDevMode()) {
    return DEV_USER as unknown as User
  }

  // In production, get real user from Supabase
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
