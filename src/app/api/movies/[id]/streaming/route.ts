import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { STREAMING_PROVIDERS, isStreamingProvider } from "@/lib/streaming";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type Params = {
  params: Promise<{ id: string }>;
};

type Payload = {
  provider?: string;
  url?: string;
};

function parseMovieId(value: string) {
  const movieId = Number(value);
  return Number.isFinite(movieId) && movieId > 0 ? Math.trunc(movieId) : null;
}

function normalizeUrl(raw?: string) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  try {
    const normalized = new URL(trimmed);
    return normalized.toString();
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (!movieId) {
    return NextResponse.json({ error: "ID de filme invalido." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("movie_streaming")
    .select("provider, url, added_by, updated_at")
    .eq("movie_id", movieId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel carregar streamings." },
      { status: 500 },
    );
  }

  return NextResponse.json({ items: data ?? [], providers: STREAMING_PROVIDERS });
}

export async function POST(request: Request, { params }: Params) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseMovieId(id);
  if (!movieId) {
    return NextResponse.json({ error: "ID de filme invalido." }, { status: 400 });
  }

  const body = (await request.json()) as Payload;
  const provider = String(body.provider ?? "");

  if (!isStreamingProvider(provider)) {
    return NextResponse.json({ error: "Streaming invalido." }, { status: 400 });
  }

  const url = provider === "piracy" ? normalizeUrl(body.url) : null;
  if (provider === "piracy" && !url) {
    return NextResponse.json(
      { error: "Link valido obrigatorio para pirataria." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("movie_streaming").upsert(
    {
      movie_id: movieId,
      provider,
      url,
      added_by: username,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "movie_id,provider" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel salvar streaming." },
      { status: 500 },
    );
  }

  return GET(request, { params });
}

export async function DELETE(request: Request, { params }: Params) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseMovieId(id);
  if (!movieId) {
    return NextResponse.json({ error: "ID de filme invalido." }, { status: 400 });
  }

  const body = (await request.json()) as Payload;
  const provider = String(body.provider ?? "");
  if (!isStreamingProvider(provider)) {
    return NextResponse.json({ error: "Streaming invalido." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("movie_streaming")
    .delete()
    .eq("movie_id", movieId)
    .eq("provider", provider);

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel remover streaming." },
      { status: 500 },
    );
  }

  return GET(request, { params });
}
