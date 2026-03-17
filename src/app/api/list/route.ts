import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type MoviePayload = {
  listId?: string;
  movieId: number;
  title: string;
  posterPath?: string | null;
  releaseDate?: string | null;
  voteAverage?: number | null;
};

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

  if (error || !created) {
    return [];
  }

  return [created];
}

function getValidActiveListId(
  requestedListId: string | null,
  lists: Array<{ id: string }>,
): string | null {
  if (!lists.length) return null;
  if (requestedListId && lists.some((list) => list.id === requestedListId)) {
    return requestedListId;
  }
  return lists[0].id;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [], lists: [], activeListId: null });
  }

  const requestedListId = new URL(request.url).searchParams.get("listId");
  const lists = await ensureDefaultList(user.id);
  const activeListId = getValidActiveListId(requestedListId, lists);
  const supabase = getSupabaseServerClient();
  const query = supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const { data, error } = activeListId ? await query.eq("list_id", activeListId) : await query;

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel carregar sua lista." }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], lists, activeListId });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const payload = (await request.json()) as MoviePayload;
  if (!payload.movieId || !payload.title) {
    return NextResponse.json({ error: "Dados do filme incompletos." }, { status: 400 });
  }

  const lists = await ensureDefaultList(user.id);
  const targetListId = getValidActiveListId(payload.listId ?? null, lists);
  if (!targetListId) {
    return NextResponse.json({ error: "Crie uma lista primeiro." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_movies").upsert(
    {
      user_id: user.id,
      list_id: targetListId,
      movie_id: payload.movieId,
      title: payload.title,
      poster_path: payload.posterPath ?? null,
      release_date: payload.releaseDate ?? null,
      vote_average: payload.voteAverage ?? null,
    },
    { onConflict: "list_id,movie_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel adicionar filme." }, { status: 500 });
  }

  await supabase
    .from("user_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", targetListId)
    .eq("user_id", user.id);

  const responseRequest = new Request(`${request.url}?listId=${encodeURIComponent(targetListId)}`);
  return GET(responseRequest);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { movieId, listId } = (await request.json()) as { movieId?: number; listId?: string };
  if (!movieId) {
    return NextResponse.json({ error: "movieId e obrigatorio." }, { status: 400 });
  }

  const lists = await ensureDefaultList(user.id);
  const targetListId = getValidActiveListId(listId ?? null, lists);
  if (!targetListId) {
    return NextResponse.json({ error: "Lista invalida." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("user_movies")
    .delete()
    .eq("user_id", user.id)
    .eq("list_id", targetListId)
    .eq("movie_id", movieId);

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel remover filme." }, { status: 500 });
  }

  await supabase
    .from("user_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", targetListId)
    .eq("user_id", user.id);

  const responseRequest = new Request(`${request.url}?listId=${encodeURIComponent(targetListId)}`);
  return GET(responseRequest);
}
