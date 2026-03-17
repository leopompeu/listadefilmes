/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { OtherUserListClient } from "@/components/users/other-user-list-client";
import { getCurrentSessionUser, getUserListState } from "@/lib/server-app-data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type Params = {
  params: Promise<{ username: string }>;
};

function normalizeUsername(username: string) {
  return decodeURIComponent(username).trim().toLowerCase().slice(0, 40);
}

type OtherUser = {
  id: string;
  username: string;
  photo_url: string | null;
};

type ListItem = {
  list_id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
};

type LikedMovie = {
  movie_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  rating: number | null;
  comment: string | null;
};

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export default async function OtherUserListPage({ params }: Params) {
  const { username } = await params;
  const usernameParam = normalizeUsername(username);
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser) {
    return (
      <main className="min-h-screen px-4 py-8 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <section className="glass-shell p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Acesso restrito</h1>
            <p className="mt-2 text-sm text-slate-200">Faca login para visualizar listas de usuarios.</p>
            <Link href="/" className="glass-secondary mt-4 inline-flex px-4 py-2 text-sm">
              Voltar ao catalogo
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: targetUser } = await supabase
    .from("app_users")
    .select("id, username, photo_url")
    .eq("username", usernameParam)
    .maybeSingle();

  const safeTargetUser = (targetUser as OtherUser | null) ?? null;
  if (!safeTargetUser) {
    return (
      <main className="min-h-screen px-4 py-8 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <section className="glass-shell p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Usuario nao encontrado</h1>
            <Link href="/usuarios" className="glass-secondary mt-4 inline-flex px-4 py-2 text-sm">
              Voltar para usuarios
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const { data: targetLists } = await supabase
    .from("user_lists")
    .select("id, name, updated_at")
    .eq("user_id", safeTargetUser.id)
    .order("updated_at", { ascending: false });

  const activeListId = (targetLists?.[0]?.id as string | undefined) ?? "";
  const { data: targetItems } = activeListId
    ? await supabase
        .from("user_movies")
        .select("*")
        .eq("user_id", safeTargetUser.id)
        .eq("list_id", activeListId)
        .order("added_at", { ascending: false })
    : { data: [] };
  const { data: likedMovies } = await supabase
    .from("user_movie_interactions")
    .select("movie_id, title, poster_path, vote_average, rating, comment")
    .eq("user_id", safeTargetUser.id)
    .eq("liked", true)
    .order("updated_at", { ascending: false });

  const myListState = await getUserListState(sessionUser.id);

  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {safeTargetUser.photo_url ? (
                <img
                  src={safeTargetUser.photo_url}
                  alt={safeTargetUser.username}
                  className="h-12 w-12 rounded-full border border-white/30 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white">
                  {safeTargetUser.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="brand-sub">comunidade</p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                  Listas de {safeTargetUser.username}
                </h1>
              </div>
            </div>
            <Link href="/" className="glass-secondary px-4 py-2 text-sm">
              Voltar ao catalogo
            </Link>
          </div>
        </section>

        <OtherUserListClient
          usernameParam={safeTargetUser.username}
          initialItems={(targetItems ?? []) as ListItem[]}
          initialLists={((targetLists ?? []) as Array<{ id: string; name: string }>).map((entry) => ({
            id: entry.id,
            name: entry.name,
          }))}
          initialActiveListId={activeListId}
          initialMyLists={myListState.lists}
          initialMyActiveListId={myListState.activeListId}
          initialMyListIds={myListState.items.map((item) => item.movie_id)}
        />

        <section className="glass-panel mt-6 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Filmes curtidos</h2>
            <span className="text-xs text-slate-300">{(likedMovies ?? []).length} filme(s)</span>
          </div>
          {!likedMovies?.length ? (
            <p className="mt-3 text-sm text-slate-200">Esse usuario ainda nao curtiu nenhum filme.</p>
          ) : (
            <div className="movie-grid mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(likedMovies as LikedMovie[]).map((movie) => (
                <article key={movie.movie_id} className="glass-tile flex h-full flex-col p-3">
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-black/30">
                    {movie.poster_path ? (
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
                    Nota do usuario: {movie.rating ?? 0}/5 · TMDB: {movie.vote_average?.toFixed(1) ?? "-"}
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
      </div>
    </main>
  );
}
