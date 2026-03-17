import { env } from "@/lib/env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TmdbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  director?: string | null;
};

export type TmdbMovieDetails = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string;
  budget: number;
  revenue: number;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string }>;
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
  videos: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
};

export type DiscoverFilters = {
  page: number;
  includeAdult?: boolean;
  includeVideo?: boolean;
  language?: string;
  sortBy?: string;
  withGenres?: string;
  primaryReleaseYear?: string;
  voteAverageGte?: string;
};

export type TmdbGenre = {
  id: number;
  name: string;
};

async function tmdbFetch<T>(path: string) {
  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${env.tmdbReadAccessToken}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

type TmdbPagedResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
};

type TmdbMovieCredits = {
  crew: Array<{
    name: string;
    job: string;
    department: string;
  }>;
};

export async function discoverMovies(filters: DiscoverFilters) {
  const safePage = Number.isNaN(filters.page)
    ? 1
    : Math.max(1, Math.min(filters.page, 500));
  const params = new URLSearchParams({
    include_adult: String(filters.includeAdult ?? false),
    include_video: String(filters.includeVideo ?? false),
    language: filters.language ?? "pt-BR",
    page: String(safePage),
    sort_by: filters.sortBy ?? "popularity.desc",
  });

  if (filters.withGenres) params.set("with_genres", filters.withGenres);
  if (filters.primaryReleaseYear) {
    params.set("primary_release_year", filters.primaryReleaseYear);
  }
  if (filters.voteAverageGte) {
    params.set("vote_average.gte", filters.voteAverageGte);
  }

  return tmdbFetch<TmdbPagedResponse>(`/discover/movie?${params.toString()}`);
}

async function getMovieDirector(movieId: number) {
  try {
    const safeId = Math.max(1, Math.trunc(movieId));
    const credits = await tmdbFetch<TmdbMovieCredits>(`/movie/${safeId}/credits?language=pt-BR`);
    const director = credits.crew.find((member) => member.job === "Director");
    return director?.name ?? null;
  } catch {
    return null;
  }
}

export async function addDirectorsToMovies(movies: TmdbMovie[]) {
  return Promise.all(
    movies.map(async (movie) => ({
      ...movie,
      director: await getMovieDirector(movie.id),
    })),
  );
}

export async function searchMovies(query: string, page: number) {
  const safePage = Number.isNaN(page) ? 1 : Math.max(1, Math.min(page, 500));
  const encoded = encodeURIComponent(query);

  return tmdbFetch<TmdbPagedResponse>(
    `/search/movie?query=${encoded}&include_adult=false&language=pt-BR&page=${safePage}`,
  );
}

export async function getMovieGenres() {
  return tmdbFetch<{ genres: TmdbGenre[] }>("/genre/movie/list?language=pt-BR");
}

export async function getMovieDetails(movieId: number) {
  const safeId = Math.max(1, Math.trunc(movieId));
  return tmdbFetch<TmdbMovieDetails>(
    `/movie/${safeId}?language=pt-BR&append_to_response=credits,videos`,
  );
}
