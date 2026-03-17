/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ListItem = {
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
};

type OtherUser = {
  username: string;
  photo_url: string | null;
};

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Sem data";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

export default function OtherUserListPage() {
  const params = useParams<{ username: string }>();
  const usernameParam = decodeURIComponent(params.username ?? "");
  const [targetUser, setTargetUser] = useState<OtherUser | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [myListIds, setMyListIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyMovie, setBusyMovie] = useState<number | null>(null);

  const title = useMemo(
    () => (targetUser ? `Lista de ${targetUser.username}` : "Lista de usuario"),
    [targetUser],
  );

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameParam]);

  async function loadData() {
    setLoading(true);
    try {
      const [listResponse, myListResponse] = await Promise.all([
        fetch(`/api/users/${encodeURIComponent(usernameParam)}/list`),
        fetch("/api/list"),
      ]);

      const listData = (await listResponse.json()) as {
        user?: OtherUser;
        items?: ListItem[];
      };
      const myListData = (await myListResponse.json()) as { items?: ListItem[] };

      setTargetUser(listData.user ?? null);
      setItems(listData.items ?? []);
      setMyListIds(new Set((myListData.items ?? []).map((item) => item.movie_id)));
    } finally {
      setLoading(false);
    }
  }

  async function addToMyList(item: ListItem) {
    setBusyMovie(item.movie_id);
    try {
      const response = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: item.movie_id,
          title: item.title,
          posterPath: item.poster_path,
          releaseDate: item.release_date,
          voteAverage: item.vote_average,
        }),
      });

      if (response.ok) {
        setMyListIds((current) => new Set(current).add(item.movie_id));
      }
    } finally {
      setBusyMovie(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {targetUser?.photo_url ? (
                <img
                  src={targetUser.photo_url}
                  alt={targetUser.username}
                  className="h-12 w-12 rounded-full border border-white/30 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white">
                  {usernameParam.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="brand-sub">comunidade</p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">{title}</h1>
              </div>
            </div>
            <Link href="/" className="glass-secondary px-4 py-2 text-sm">
              Voltar ao catalogo
            </Link>
          </div>
        </section>

        <section className="glass-panel p-5">
          {loading ? (
            <div className="movie-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <article key={index} className="movie-card glass-tile p-3">
                  <div className="skeleton aspect-[2/3] rounded-xl" />
                  <div className="skeleton mt-3 h-4 rounded-md" />
                  <div className="skeleton mt-2 h-3 w-3/4 rounded-md" />
                  <div className="skeleton mt-3 h-9 rounded-full" />
                </article>
              ))}
            </div>
          ) : !items.length ? (
            <p className="text-sm text-slate-100">Esse usuario ainda nao possui filmes na lista.</p>
          ) : (
            <div className="movie-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article key={item.movie_id} className="movie-card glass-tile flex h-full flex-col p-3">
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-black/30">
                    {item.poster_path ? (
                      <img
                        src={posterUrl(item.poster_path)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-300">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <div className="mt-3 min-h-[4.3rem]">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-300">
                      {formatDate(item.release_date)} · {item.vote_average?.toFixed(1) ?? "-"}
                    </p>
                  </div>

                  <button
                    className="liquid-button mt-auto w-full text-sm"
                    type="button"
                    disabled={myListIds.has(item.movie_id) || busyMovie === item.movie_id}
                    onClick={() => void addToMyList(item)}
                  >
                    {myListIds.has(item.movie_id)
                      ? "Adicionado"
                      : busyMovie === item.movie_id
                        ? "Salvando..."
                        : "Adicionar"}
                  </button>
                  <Link
                    href={`/filme/${item.movie_id}`}
                    className="glass-secondary mt-2 flex h-9 w-full items-center justify-center text-sm"
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
