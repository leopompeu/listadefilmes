import { NextResponse } from "next/server";
import { getMovieGenres } from "@/lib/tmdb";

export async function GET() {
  try {
    const data = await getMovieGenres();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Nao foi possivel carregar generos." }, { status: 500 });
  }
}
