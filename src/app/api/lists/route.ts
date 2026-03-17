import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type CreateListPayload = {
  name?: string;
};

function sanitizeListName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 50);
}

async function getCurrentUser() {
  const username = await getSessionUsername();
  if (!username) return null;

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("app_users")
    .select("id, username, photo_url")
    .eq("username", username)
    .maybeSingle();

  return data;
}

async function ensureDefaultList(userId: string) {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("user_lists")
    .select("id, user_id, name, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (existing && existing.length > 0) {
    return existing;
  }

  const { data: created, error } = await supabase
    .from("user_lists")
    .insert({ user_id: userId, name: "Minha Lista" })
    .select("id, user_id, name, created_at, updated_at")
    .single();

  if (error || !created) return [];
  return [created];
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ lists: [] });
  }

  const lists = await ensureDefaultList(user.id);
  return NextResponse.json({ lists });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const payload = (await request.json()) as CreateListPayload;
  const name = sanitizeListName(payload.name ?? "");
  if (!name) {
    return NextResponse.json({ error: "Nome da lista e obrigatorio." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_lists")
    .insert({ user_id: user.id, name })
    .select("id, user_id, name, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nao foi possivel criar lista." }, { status: 500 });
  }

  return NextResponse.json({ list: data });
}
