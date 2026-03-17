import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const currentUsername = await getSessionUsername();
  if (!currentUsername) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("username, photo_url")
    .neq("username", currentUsername)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel carregar os usuarios." },
      { status: 500 },
    );
  }

  return NextResponse.json({ users: data ?? [] });
}
