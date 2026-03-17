import { NextResponse } from "next/server";
import { clearSession, getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function toPublicUser(user: { id: string; username: string; photo_url: string | null }) {
  return {
    id: user.id,
    username: user.username,
    photo_url: user.photo_url,
  };
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ user: null });
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("app_users")
    .select("id, username, photo_url")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ user: data ? toPublicUser(data) : null });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
