import { NextResponse } from "next/server";
import { sanitizeUsername, validatePassword, verifyPassword } from "@/lib/auth";
import { setSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = sanitizeUsername(body.username ?? "");
    const password = body.password ?? "";

    if (!username || !validatePassword(password)) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user } = await supabase
      .from("app_users")
      .select("id, username, password_hash, photo_url")
      .eq("username", username)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "Usuario ou senha incorretos." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Usuario ou senha incorretos." }, { status: 401 });
    }

    await setSessionUsername(username);
    return NextResponse.json({
      user: { id: user.id, username: user.username, photo_url: user.photo_url },
    });
  } catch {
    return NextResponse.json({ error: "Falha no login." }, { status: 500 });
  }
}
