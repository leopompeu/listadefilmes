import { NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/tmdb";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const movieId = Number(id);

    if (!Number.isFinite(movieId) || movieId < 1) {
      return NextResponse.json({ error: "ID de filme invalido." }, { status: 400 });
    }

    const data = await getMovieDetails(movieId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel carregar os detalhes do filme." },
      { status: 500 },
    );
  }
}
