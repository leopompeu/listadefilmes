import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type Params = {
  params: Promise<{ username: string }>;
};

function normalizeUsername(username: string) {
  return decodeURIComponent(username).trim().toLowerCase().slice(0, 40);
}

export async function GET(_: Request, { params }: Params) {
  const currentUsername = await getSessionUsername();
  if (!currentUsername) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { username } = await params;
  const targetUsername = normalizeUsername(username);
  if (!targetUsername) {
    return NextResponse.json({ error: "Usuario invalido." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: targetUser } = await supabase
    .from("app_users")
    .select("id, username, photo_url")
    .eq("username", targetUsername)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  const { data: lists, error: listsError } = await supabase
    .from("user_lists")
    .select("id, name, created_at, updated_at")
    .eq("user_id", targetUser.id)
    .order("updated_at", { ascending: false });

  if (listsError) {
    return NextResponse.json(
      { error: "Nao foi possivel carregar as listas do usuario." },
      { status: 500 },
    );
  }

  const requestedListId = new URL(_.url).searchParams.get("listId");
  const activeListId =
    requestedListId && lists?.some((list) => list.id === requestedListId)
      ? requestedListId
      : (lists?.[0]?.id ?? null);

  const movieQuery = supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", targetUser.id)
    .order("added_at", { ascending: false });
  const { data: items, error } = activeListId
    ? await movieQuery.eq("list_id", activeListId)
    : await movieQuery;

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel carregar a lista do usuario." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    user: { username: targetUser.username, photo_url: targetUser.photo_url },
    lists: lists ?? [],
    activeListId,
    items: items ?? [],
  });
}
