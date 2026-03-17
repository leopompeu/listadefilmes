import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/home/logout-button";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { UserSettingsClient } from "@/components/user/user-settings-client";
import { getCurrentSessionUser, getUserLikedMovies } from "@/lib/server-app-data";

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export default async function UserPage() {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect("/");
  }
  const likedMovies = await getUserLikedMovies(user.id);

  return (
    <main className="min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-5 p-5 md:mb-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Minha Conta</h1>
              <p className="mt-2 text-sm text-slate-200">Gerencie foto, senha e dados do seu perfil.</p>
              <p className="mt-2 text-xs text-slate-300">Logado como {user.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="glass-secondary inline-flex h-10 items-center px-4 text-sm">
                Voltar
              </Link>
              <LogoutButton className="glass-secondary h-10 px-4 text-sm" />
            </div>
          </div>
        </section>

        <UserSettingsClient user={user} />

        <section className="glass-panel mt-6 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Filmes curtidos</h2>
            <span className="text-xs text-slate-300">{likedMovies.length} filme(s)</span>
          </div>
          {!likedMovies.length ? (
            <p className="mt-3 text-sm text-slate-200">Voce ainda nao curtiu nenhum filme.</p>
          ) : (
            <div className="movie-grid mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {likedMovies.map((movie) => (
                <article key={movie.movie_id} className="glass-tile flex h-full flex-col p-3">
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-black/30">
                    {movie.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={posterUrl(movie.poster_path)}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-300">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-white">{movie.title}</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Sua nota: {movie.rating ?? 0}/5 · TMDB: {movie.vote_average?.toFixed(1) ?? "-"}
                  </p>
                  {movie.comment ? <p className="mt-2 line-clamp-3 text-xs text-slate-200">{movie.comment}</p> : null}
                  <Link
                    href={`/filme/${movie.movie_id}`}
                    className="glass-secondary mt-auto flex h-9 w-full items-center justify-center text-sm"
                  >
                    Ver detalhes
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <MobileBottomNav active="home" />
      </div>
    </main>
  );
}
