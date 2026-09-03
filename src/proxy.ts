import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const ruteAdmin = pathname.startsWith("/dewan");
  const ruteLaporanSaya = pathname.startsWith("/laporan-saya");
  const rutePrivat = ruteAdmin || ruteLaporanSaya;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (rutePrivat) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/masuk";
      redirectUrl.searchParams.set(
        "next",
        pathname + request.nextUrl.search
      );
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  let cookiesToSet: { name: string; value: string; options: CookieOptions }[] =
    [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet = [...cookiesToSet, ...cookies];
        cookies.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (rutePrivat && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/masuk";
    redirectUrl.searchParams.set("next", pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(redirectUrl);
    cookiesToSet.forEach(({ name, value, options }) =>
      redirect.cookies.set(name, value, options)
    );
    return redirect;
  }

  if (ruteAdmin && user) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profil?.role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/peta";
      const redirect = NextResponse.redirect(redirectUrl);
      cookiesToSet.forEach(({ name, value, options }) =>
        redirect.cookies.set(name, value, options)
      );
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: ["/dewan/:path*", "/laporan-saya/:path*"],
};
