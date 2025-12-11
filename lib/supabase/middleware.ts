import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"

  if (isDevMode) {
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
    "/features",
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

  // Redirect authenticated users away from auth pages to learn page
  if (user && isAuthRoute && !pathname.includes("/auth/sign-up-success")) {
    const url = request.nextUrl.clone()
    url.pathname = "/app/learn"
    return NextResponse.redirect(url)
  }

  // Check if authenticated user needs to complete onboarding (diagnostic assessment)
  // Skip check for the diagnostic page itself and API routes
  if (user && isProtectedRoute && !pathname.startsWith("/app/diagnostic") && !pathname.startsWith("/api")) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()

    // Redirect to diagnostic if onboarding not completed
    if (profile && profile.onboarding_completed === false) {
      const url = request.nextUrl.clone()
      url.pathname = "/app/diagnostic"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
