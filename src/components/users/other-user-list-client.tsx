/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { GlassSelect } from "@/components/glass-select";

type ListItem = {
  list_id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
};

type UserList = {
  id: string;
  name: string;
};

type OtherUser = {
  username: string;
  photo_url: string | null;
};

type Props = {
  usernameParam: string;
  initialItems: ListItem[];
  initialLists: UserList[];
  initialActiveListId: string;
  initialMyLists: UserList[];
  initialMyActiveListId: string;
  initialMyListIds: number[];
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

export function OtherUserListClient({
  usernameParam,
  initialItems,
  initialLists,
  initialActiveListId,
  initialMyLists,
  initialMyActiveListId,
  initialMyListIds,
}: Props) {
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [lists, setLists] = useState<UserList[]>(initialLists);
  const [activeListId, setActiveListId] = useState(initialActiveListId);
  const [myLists, setMyLists] = useState<UserList[]>(initialMyLists);
  const [myActiveListId, setMyActiveListId] = useState(initialMyActiveListId);
  const [myListIds, setMyListIds] = useState<Set<number>>(new Set(initialMyListIds));
  const [loading, setLoading] = useState(false);
  const [busyMovie, setBusyMovie] = useState<number | null>(null);

  const listOptions = useMemo(
    () => lists.map((entry) => ({ value: entry.id, label: entry.name })),
    [lists],
  );
  const myListOptions = useMemo(
    () =>
      myLists.map((entry) => ({
        value: entry.id,
        label: `Salvar em: ${entry.name}`,
      })),
    [myLists],
  );

  const loadData = useCallback(
    async (targetListId?: string) => {
      setLoading(true);
      try {
        const listQuery = targetListId ? `?listId=${encodeURIComponent(targetListId)}` : "";
        const [listResponse, myListResponse] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(usernameParam)}/list${listQuery}`),
          fetch("/api/list"),
        ]);

        const listData = (await listResponse.json()) as {
          user?: OtherUser;
          lists?: UserList[];
          activeListId?: string | null;
          items?: ListItem[];
        };
        const myListData = (await myListResponse.json()) as {
          lists?: UserList[];
          activeListId?: string | null;
          items?: ListItem[];
        };

        setLists(listData.lists ?? []);
        setActiveListId(listData.activeListId ?? "");
        setItems(listData.items ?? []);
        setMyLists(myListData.lists ?? []);
        setMyActiveListId(myListData.activeListId ?? "");
        setMyListIds(new Set((myListData.items ?? []).map((item) => item.movie_id)));
      } finally {
        setLoading(false);
      }
    },
    [usernameParam],
  );

  const loadMyListPreview = useCallback(async (listId: string) => {
    const response = await fetch(`/api/list?listId=${encodeURIComponent(listId)}`);
    if (!response.ok) return;
    const data = (await response.json()) as { items?: ListItem[] };
    setMyListIds(new Set((data.items ?? []).map((item) => item.movie_id)));
  }, []);

  const addToMyList = useCallback(
    async (item: ListItem) => {
      setBusyMovie(item.movie_id);
      try {
        const response = await fetch("/api/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listId: myActiveListId,
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
    },
    [myActiveListId],
  );

  return (
    <section className="glass-panel p-5">
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <GlassSelect
          value={activeListId}
          onChange={(nextValue) => {
            setActiveListId(nextValue);
            void loadData(nextValue);
          }}
          options={listOptions}
          placeholder="Selecionar lista"
        />
        <GlassSelect
          value={myActiveListId}
          onChange={(nextValue) => {
            setMyActiveListId(nextValue);
            void loadMyListPreview(nextValue);
          }}
          options={myListOptions}
          placeholder="Selecionar destino"
        />
      </div>
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
                disabled={!myActiveListId || myListIds.has(item.movie_id) || busyMovie === item.movie_id}
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
  );
}
