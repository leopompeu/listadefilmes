import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getMovieInteractionsState } from "@/lib/server-app-data";

type Params = {
  params: Promise<{ id: string }>;
};

type UpdatePayload = {
  watched?: boolean;
  liked?: boolean;
  rating?: number | null;
  comment?: string | null;
  title?: string;
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
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  return data as { id: string; username: string } | null;
}

function validateMovieId(rawId: string) {
  const movieId = Number(rawId);
  if (!Number.isFinite(movieId) || movieId < 1) {
    return null;
  }
  return movieId;
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const movieId = validateMovieId(id);
  if (!movieId) {
    return NextResponse.json({ error: "ID de filme invalido." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const state = await getMovieInteractionsState(movieId, user?.id);
  return NextResponse.json(state);
}

export async function PUT(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { id } = await params;
  const movieId = validateMovieId(id);
  if (!movieId) {
    return NextResponse.json({ error: "ID de filme invalido." }, { status: 400 });
  }

  const payload = (await request.json()) as UpdatePayload;
  const watched = Boolean(payload.watched);
  const liked = Boolean(payload.liked);
  const rating =
    payload.rating === null || payload.rating === undefined ? null : Number(payload.rating);
  const normalizedComment = (payload.comment ?? "").trim();
  const comment = normalizedComment ? normalizedComment : null;

  if (comment && comment.length > 500) {
    return NextResponse.json(
      { error: "Comentario deve ter no maximo 500 caracteres." },
      { status: 400 },
    );
  }

  const isHalfStep = rating === null ? true : Math.round(rating * 2) === rating * 2;
  if (rating !== null && (!isHalfStep || rating < 0 || rating > 5)) {
    return NextResponse.json({ error: "A nota deve ser entre 0 e 5, em passos de 0.5." }, { status: 400 });
  }

  if (!payload.title || payload.title.trim().length === 0) {
    return NextResponse.json({ error: "Titulo do filme e obrigatorio." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_movie_interactions").upsert(
    {
      user_id: user.id,
      movie_id: movieId,
      title: payload.title.trim(),
      poster_path: payload.posterPath ?? null,
      release_date: payload.releaseDate ?? null,
      vote_average: payload.voteAverage ?? null,
      watched,
      liked,
      rating,
      comment,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,movie_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel salvar sua avaliacao." }, { status: 500 });
  }

  const state = await getMovieInteractionsState(movieId, user.id);
  return NextResponse.json(state);
}
