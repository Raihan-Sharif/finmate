import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'bn'],
  defaultLocale: 'en'
});

export async function middleware(request: NextRequest) {
  // Skip i18n middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Apply internationalization middleware
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware wants to redirect, use that response
  if (intlResponse.status !== 200) {
    // Copy auth cookies to the intl redirect response
    response.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        domain: cookie.domain,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
      })
    })
    return intlResponse;
  }

  const url = request.nextUrl.clone()
  
  // Protected routes that require authentication
  if (url.pathname.includes('/dashboard') || 
      url.pathname.includes('/admin') || 
      url.pathname.includes('/emi')) {
    if (!user) {
      url.pathname = `/${url.pathname.split('/')[1]}/auth/signin`
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages
  if ((url.pathname.includes('/auth/signin') || 
       url.pathname.includes('/auth/signup')) && user) {
    url.pathname = `/${url.pathname.split('/')[1]}/dashboard`
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}