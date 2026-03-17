/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { StreamingSection } from "@/components/streaming-section";
import { getMovieDetails } from "@/lib/tmdb";

type Params = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  if (!value) return "Nao informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w780${path}`;
}

function profileUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w185${path}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Nao informado";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Nao informado";
  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

export default async function MovieDetailsPage({ params }: Params) {
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isFinite(movieId) || movieId < 1) {
    notFound();
  }

  let movie: Awaited<ReturnType<typeof getMovieDetails>>;
  try {
    movie = await getMovieDetails(movieId);
  } catch {
    notFound();
  }

  const directors = movie.credits.crew
    .filter((member) => member.job === "Director")
    .slice(0, 3)
    .map((member) => member.name);
  const topCast = movie.credits.cast.slice(0, 12);
  const trailer = movie.videos.results.find(
    (video) => video.site === "YouTube" && video.type === "Trailer",
  );

  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="glass-secondary px-4 py-2 text-sm">
              Voltar
            </Link>
            {trailer ? (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="liquid-button px-4 py-2 text-sm"
              >
                Ver trailer
              </a>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/30">
              {movie.poster_path ? (
                <img
                  src={posterUrl(movie.poster_path)}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-sm text-slate-300">
                  Sem poster
                </div>
              )}
            </div>

            <div>
              <p className="brand-sub">detalhes do filme</p>
              <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">
                {movie.title}
              </h1>
              <p className="mt-2 text-sm text-slate-200">
                Titulo original: {movie.original_title}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="glass-secondary px-3 py-1 text-xs">
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-100">
                {movie.overview || "Sem sinopse disponivel."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="glass-tile p-3 text-sm text-slate-100">
                  <strong>Data de lancamento:</strong> {formatDate(movie.release_date)}
                </div>
                <div className="glass-tile p-3 text-sm text-slate-100">
                  <strong>Duracao:</strong>{" "}
                  {movie.runtime ? `${movie.runtime} min` : "Nao informado"}
                </div>
                <div className="glass-tile p-3 text-sm text-slate-100">
                  <strong>Nota:</strong> {movie.vote_average.toFixed(1)} ({movie.vote_count} votos)
                </div>
                <div className="glass-tile p-3 text-sm text-slate-100">
                  <strong>Status:</strong> {movie.status || "Nao informado"}
                </div>
                <div className="glass-tile p-3 text-sm text-slate-100">
                  <strong>Orcamento:</strong> {money(movie.budget)}
                </div>
                <div className="glass-tile p-3 text-sm text-slate-100">
                  <strong>Receita:</strong> {money(movie.revenue)}
                </div>
              </div>

              <div className="mt-5 glass-tile p-3 text-sm text-slate-100">
                <strong>Direcao:</strong>{" "}
                {directors.length ? directors.join(", ") : "Nao informado"}
              </div>

              <div className="mt-3 glass-tile p-3 text-sm text-slate-100">
                <strong>Produtoras:</strong>{" "}
                {movie.production_companies.length
                  ? movie.production_companies.map((company) => company.name).join(", ")
                  : "Nao informado"}
              </div>
            </div>
          </div>

          <StreamingSection movieId={movie.id} />

          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-white">Elenco principal</h2>
            {topCast.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {topCast.map((person) => (
                  <article key={person.id} className="glass-tile p-3">
                    <div className="overflow-hidden rounded-xl bg-black/30">
                      {person.profile_path ? (
                        <img
                          src={profileUrl(person.profile_path)}
                          alt={person.name}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center text-sm text-slate-300">
                          Sem foto
                        </div>
                      )}
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold text-white">
                      {person.name}
                    </p>
                    <p className="truncate text-xs text-slate-200">Como {person.character}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-200">Sem informacoes de elenco.</p>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
