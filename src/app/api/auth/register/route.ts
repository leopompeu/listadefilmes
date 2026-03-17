import { NextResponse } from "next/server";
import { hashPassword, sanitizeUsername, validatePassword } from "@/lib/auth";
import { setSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = sanitizeUsername(body.username ?? "");
    const password = body.password ?? "";

    if (!username || username.length < 2) {
      return NextResponse.json(
        { error: "Usuario deve ter no minimo 2 caracteres." },
        { status: 400 },
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Senha deve ter entre 6 e 72 caracteres." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from("app_users")
      .insert({ username, password_hash: passwordHash })
      .select("id, username, photo_url")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Usuario ja cadastrado." }, { status: 409 });
      }
      throw error;
    }

    await setSessionUsername(username);
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ error: "Falha ao criar conta." }, { status: 500 });
  }
}
