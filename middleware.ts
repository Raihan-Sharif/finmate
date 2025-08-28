import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Critical: This refreshes the session and updates cookies
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If there's an auth error, clear cookies to prevent infinite loops
  if (error) {
    response.cookies.delete('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
  }

  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(en|bn)(\/.*)$/);
  const locale = localeMatch?.[1] || 'en';
  const pathWithoutLocale = localeMatch?.[2] || pathname;

  // Protected routes (without locale prefix)
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(path => 
    pathWithoutLocale.startsWith(path)
  );

  // Auth pages (without locale prefix)
  const authPaths = ['/auth/signin', '/auth/signup'];
  const isAuthPath = authPaths.some(path => 
    pathWithoutLocale.startsWith(path)
  );

  // Use the user from above to avoid additional API calls
  // const { data: { user } } = await supabase.auth.getUser();

  // Redirect logic with locale support
  if (isProtectedPath && !user) {
    // Redirect to sign in if accessing protected route without auth
    const redirectUrl = new URL(`/${locale}/auth/signin`, request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && user) {
    // Redirect to dashboard if accessing auth pages while authenticated
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Handle i18n routing
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('/api/') ||
    request.nextUrl.pathname.match(/\.(ico|png|svg|jpg|jpeg|gif|webp)$/)
  ) {
    return response;
  }

  // Handle internationalization for non-auth routes
  const intlMiddleware = createMiddleware(routing);
  const intlResponse = intlMiddleware(request);
  
  // Merge auth cookies with intl response
  if (intlResponse && intlResponse !== response) {
    // Copy auth cookies to intl response
    response.cookies.getAll().forEach(cookie => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });
    return intlResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};