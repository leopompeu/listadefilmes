import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const page = Number(searchParams.get("page") ?? "1");

    if (!query) {
      return NextResponse.json({ page: 1, total_pages: 0, total_results: 0, results: [] });
    }

    const data = await searchMovies(query, page);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Nao foi possivel buscar filmes." }, { status: 500 });
  }
}
