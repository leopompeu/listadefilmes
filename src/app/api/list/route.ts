import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type MoviePayload = {
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

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel carregar sua lista." }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
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

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_movies").upsert(
    {
      user_id: user.id,
      movie_id: payload.movieId,
      title: payload.title,
      poster_path: payload.posterPath ?? null,
      release_date: payload.releaseDate ?? null,
      vote_average: payload.voteAverage ?? null,
    },
    { onConflict: "user_id,movie_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel adicionar filme." }, { status: 500 });
  }

  return GET();
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { movieId } = (await request.json()) as { movieId?: number };
  if (!movieId) {
    return NextResponse.json({ error: "movieId e obrigatorio." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("user_movies")
    .delete()
    .eq("user_id", user.id)
    .eq("movie_id", movieId);

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel remover filme." }, { status: 500 });
  }

  return GET();
}
