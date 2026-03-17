import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type Params = {
  params: Promise<{ id: string }>;
};

type UpdateListPayload = {
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

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { id } = await params;
  const payload = (await request.json()) as UpdateListPayload;
  const name = sanitizeListName(payload.name ?? "");
  if (!name) {
    return NextResponse.json({ error: "Nome da lista e obrigatorio." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_lists")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, name, created_at, updated_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Nao foi possivel atualizar lista." }, { status: 500 });
  }

  return NextResponse.json({ list: data });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: lists } = await supabase
    .from("user_lists")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (!lists?.length) {
    return NextResponse.json({ error: "Nenhuma lista encontrada." }, { status: 404 });
  }

  if (lists.length === 1) {
    return NextResponse.json({ error: "Mantenha ao menos uma lista." }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel excluir lista." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
