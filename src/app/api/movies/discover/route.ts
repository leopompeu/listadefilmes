import { NextResponse } from "next/server";
import { discoverMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await discoverMovies({
      page: Number(searchParams.get("page") ?? "1"),
      includeAdult: searchParams.get("includeAdult") === "true",
      includeVideo: searchParams.get("includeVideo") === "true",
      language: searchParams.get("language") ?? "pt-BR",
      sortBy: searchParams.get("sortBy") ?? "popularity.desc",
      withGenres: searchParams.get("withGenres") ?? "",
      primaryReleaseYear: searchParams.get("year") ?? "",
      voteAverageGte: searchParams.get("minVote") ?? "",
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Nao foi possivel carregar filmes." }, { status: 500 });
  }
}
