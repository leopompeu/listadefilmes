import { NextResponse } from "next/server";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type Payload = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
    }

    const body = (await request.json()) as Payload;
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!validatePassword(currentPassword) || !validatePassword(newPassword)) {
      return NextResponse.json(
        { error: "Senha deve ter entre 6 e 72 caracteres." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: user } = await supabase
      .from("app_users")
      .select("id, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    const { error } = await supabase
      .from("app_users")
      .update({ password_hash: passwordHash })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar senha." }, { status: 500 });
  }
}
