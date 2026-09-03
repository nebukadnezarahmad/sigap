import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isTujuanAman } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const kode = searchParams.get("code");
  const tujuanMentah = searchParams.get("next") ?? "/peta";
  const tujuan = isTujuanAman(tujuanMentah) ? tujuanMentah : "/peta";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/masuk`);
  }

  if (kode) {
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
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(kode);
    if (!error) {
      const redirect = NextResponse.redirect(`${origin}${tujuan}`);
      cookiesToSet.forEach(({ name, value, options }) =>
        redirect.cookies.set(name, value, options)
      );
      return redirect;
    }
  }

  return NextResponse.redirect(`${origin}/masuk`);
}
