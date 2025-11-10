import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"

  if (isDevMode) {
    console.log("[v0] Dev mode enabled - bypassing authentication")
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes - accessible without authentication
  const publicRoutes = [
    "/",
    "/about",
    "/why",
    "/terms",
    "/privacy",
    "/ai-policy",
  ]

  // Auth routes - accessible without authentication
  const authRoutes = [
    "/auth/login",
    "/auth/sign-up",
    "/auth/sign-up-success",
    "/auth/error",
    "/auth/forgot-password",
    "/auth/reset-password",
  ]

  // Protected routes - require authentication
  const protectedPaths = ["/app", "/admin"]

  const pathname = request.nextUrl.pathname

  // Check if route is public or auth
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))

  // Redirect unauthenticated users trying to access protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages to app
  if (user && isAuthRoute && !pathname.includes("/auth/sign-up-success")) {
    const url = request.nextUrl.clone()
    url.pathname = "/app/ai-practice"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
