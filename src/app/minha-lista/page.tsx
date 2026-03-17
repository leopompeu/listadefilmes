/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

type AppUser = {
  id: string;
  username: string;
  photo_url: string | null;
};

type ListItem = {
  movie_id: number;
  title: string;
  poster_path: string | null;
};

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export default function MyListPage() {
  const [sessionUser, setSessionUser] = useState<AppUser | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyMovieId, setBusyMovieId] = useState<number | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sessionResponse, listResponse] = await Promise.all([
        fetch("/api/session"),
        fetch("/api/list"),
      ]);

      const sessionData = (await sessionResponse.json()) as { user: AppUser | null };
      setSessionUser(sessionData.user);

      if (listResponse.ok) {
        const listData = (await listResponse.json()) as { items?: ListItem[] };
        setItems(listData.items ?? []);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function removeMovie(movieId: number) {
    setBusyMovieId(movieId);
    try {
      const response = await fetch("/api/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
      });

      if (response.ok) {
        const data = (await response.json()) as { items?: ListItem[] };
        setItems(data.items ?? []);
      }
    } finally {
      setBusyMovieId(null);
    }
  }

  return (
    <main className="min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-5 p-5 md:mb-6 md:p-8">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Minha Lista</h1>
          <p className="mt-2 text-sm text-slate-200">
            Seus filmes salvos em um unico lugar.
          </p>
          {sessionUser ? (
            <p className="mt-2 text-xs text-slate-300">Logado como {sessionUser.username}</p>
          ) : null}
        </section>

        <section className="glass-panel p-5">
          {loading ? (
            <p className="text-sm text-slate-200">Carregando lista...</p>
          ) : items.length ? (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.movie_id} className="glass-tile flex items-center gap-3 p-3">
                  <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-black/30">
                    {item.poster_path ? (
                      <img
                        src={posterUrl(item.poster_path)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="glass-secondary inline-flex h-8 items-center justify-center px-3 text-xs"
                      type="button"
                      disabled={busyMovieId === item.movie_id}
                      onClick={() => void removeMovie(item.movie_id)}
                    >
                      {busyMovieId === item.movie_id ? "..." : "Remover"}
                    </button>
                    <Link
                      href={`/filme/${item.movie_id}`}
                      className="glass-secondary inline-flex h-8 items-center justify-center px-3 text-xs"
                    >
                      Detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-200">Sua lista esta vazia.</p>
          )}
        </section>

        <MobileBottomNav active="my-list" />
      </div>
    </main>
  );
}
