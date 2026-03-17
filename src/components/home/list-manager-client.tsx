/* eslint-disable @next/next/no-img-element */
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { GlassSelect } from "@/components/glass-select";
import { LISTS_UPDATED_EVENT, ListsUpdatedPayload } from "@/components/home/list-events";
import { ListItem, ListSort, UserList } from "@/components/home/types";

const ActionDialog = dynamic(() =>
  import("@/components/action-dialog").then((module) => module.ActionDialog),
);

const LIST_SORT_OPTIONS = [
  { value: "added_desc", label: "Recem adicionados" },
  { value: "added_asc", label: "Mais antigos adicionados" },
  { value: "year_desc", label: "Ano mais recente" },
  { value: "year_asc", label: "Ano mais antigo" },
  { value: "rating_desc", label: "Nota (maior)" },
];

type Props = {
  initialItems: ListItem[];
  initialLists: UserList[];
  initialActiveListId: string;
};

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function ListManagerClient({ initialItems, initialLists, initialActiveListId }: Props) {
  const [list, setList] = useState<ListItem[]>(initialItems);
  const [lists, setLists] = useState<UserList[]>(initialLists);
  const [activeListId, setActiveListId] = useState(initialActiveListId);
  const [loadingList, setLoadingList] = useState(false);
  const [busyAction, setBusyAction] = useState<number | null>(null);
  const [listSort, setListSort] = useState<ListSort>("added_desc");
  const [showListSearch, setShowListSearch] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listNameDialogOpen, setListNameDialogOpen] = useState(false);
  const [listNameDialogMode, setListNameDialogMode] = useState<"create" | "rename">("create");
  const [listNameInput, setListNameInput] = useState("");
  const [savingListName, setSavingListName] = useState(false);
  const [deletingList, setDeletingList] = useState(false);
  const [pendingRemoveMovie, setPendingRemoveMovie] = useState<ListItem | null>(null);

  const deferredSearch = useDeferredValue(listSearchQuery);

  useEffect(() => {
    const onListsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ListsUpdatedPayload>;
      const payload = customEvent.detail;
      if (!payload) return;
      setList(payload.items);
      setLists(payload.lists);
      setActiveListId(payload.activeListId);
    };
    window.addEventListener(LISTS_UPDATED_EVENT, onListsUpdated as EventListener);
    return () => window.removeEventListener(LISTS_UPDATED_EVENT, onListsUpdated as EventListener);
  }, []);

  const activeList = useMemo(
    () => lists.find((entry) => entry.id === activeListId) ?? null,
    [lists, activeListId],
  );
  const userListOptions = useMemo(
    () => lists.map((entry) => ({ value: entry.id, label: entry.name })),
    [lists],
  );

  const sortedList = useMemo(() => {
    const getYear = (date: string | null) => {
      if (!date) return null;
      const [year] = date.split("-");
      const parsed = Number(year);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const getAddedAtTime = (value: string) => {
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    return [...list].sort((a, b) => {
      if (listSort === "added_desc") return getAddedAtTime(b.added_at) - getAddedAtTime(a.added_at);
      if (listSort === "added_asc") return getAddedAtTime(a.added_at) - getAddedAtTime(b.added_at);
      if (listSort === "year_desc") {
        const yearA = getYear(a.release_date);
        const yearB = getYear(b.release_date);
        if (yearA === yearB) return 0;
        if (yearA === null) return 1;
        if (yearB === null) return -1;
        return yearB - yearA;
      }
      if (listSort === "year_asc") {
        const yearA = getYear(a.release_date);
        const yearB = getYear(b.release_date);
        if (yearA === yearB) return 0;
        if (yearA === null) return 1;
        if (yearB === null) return -1;
        return yearA - yearB;
      }
      return (b.vote_average ?? -1) - (a.vote_average ?? -1);
    });
  }, [list, listSort]);

  const filteredList = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return sortedList;
    return sortedList.filter((item) => item.title.toLowerCase().includes(normalized));
  }, [deferredSearch, sortedList]);

  const emitListsUpdated = useCallback((payload: ListsUpdatedPayload) => {
    setList(payload.items);
    setLists(payload.lists);
    setActiveListId(payload.activeListId);
    window.dispatchEvent(new CustomEvent<ListsUpdatedPayload>(LISTS_UPDATED_EVENT, { detail: payload }));
  }, []);

  const loadList = useCallback(
    async (targetListId?: string) => {
      setLoadingList(true);
      try {
        const query = targetListId ? `?listId=${encodeURIComponent(targetListId)}` : "";
        const response = await fetch(`/api/list${query}`);
        const data = (await response.json()) as {
          items?: ListItem[];
          lists?: UserList[];
          activeListId?: string | null;
        };
        emitListsUpdated({
          items: data.items ?? [],
          lists: data.lists ?? [],
          activeListId: data.activeListId ?? "",
        });
      } finally {
        setLoadingList(false);
      }
    },
    [emitListsUpdated],
  );

  const submitListNameDialog = useCallback(async () => {
    const name = listNameInput.trim();
    if (!name) return;
    setSavingListName(true);
    try {
      if (listNameDialogMode === "create") {
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = (await response.json()) as { list?: UserList };
        if (!response.ok || !data.list) return;
        setListNameDialogOpen(false);
        await loadList(data.list.id);
        return;
      }

      if (!activeList) return;
      const response = await fetch(`/api/lists/${encodeURIComponent(activeList.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) return;
      setListNameDialogOpen(false);
      await loadList(activeList.id);
    } finally {
      setSavingListName(false);
    }
  }, [activeList, listNameDialogMode, listNameInput, loadList]);

  const confirmDeleteList = useCallback(async () => {
    if (!activeList) return;
    const response = await fetch(`/api/lists/${encodeURIComponent(activeList.id)}`, { method: "DELETE" });
    if (!response.ok) return;
    setDeletingList(false);
    await loadList();
  }, [activeList, loadList]);

  const removeMovieNow = useCallback(
    async (movieId: number) => {
      if (!activeListId) return;
      setBusyAction(movieId);
      const response = await fetch("/api/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, listId: activeListId }),
      });
      const data = (await response.json()) as {
        items?: ListItem[];
        lists?: UserList[];
        activeListId?: string | null;
      };
      setBusyAction(null);
      if (!response.ok) return;
      emitListsUpdated({
        items: data.items ?? [],
        lists: data.lists ?? lists,
        activeListId: data.activeListId ?? activeListId,
      });
    },
    [activeListId, emitListsUpdated, lists],
  );

  return (
    <aside className="glass-panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Minhas Listas</h2>
        <div className="flex items-center gap-2">
          <button
            className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
            onClick={() => {
              setListNameDialogMode("create");
              setListNameInput("");
              setListNameDialogOpen(true);
            }}
            type="button"
            aria-label="Criar lista"
          >
            <span className="material-symbols-rounded text-base" aria-hidden="true">
              add
            </span>
          </button>
          <button
            className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
            onClick={() => {
              if (!activeList) return;
              setListNameDialogMode("rename");
              setListNameInput(activeList.name);
              setListNameDialogOpen(true);
            }}
            type="button"
            disabled={!activeList}
            aria-label="Editar nome da lista"
          >
            <span className="material-symbols-rounded text-base" aria-hidden="true">
              edit
            </span>
          </button>
          <button
            className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
            onClick={() => setDeletingList(true)}
            type="button"
            disabled={!activeList}
            aria-label="Excluir lista"
          >
            <span className="material-symbols-rounded text-base" aria-hidden="true">
              delete
            </span>
          </button>
          <button
            className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
            onClick={() =>
              setShowListSearch((current) => {
                const next = !current;
                if (!next) setListSearchQuery("");
                return next;
              })
            }
            type="button"
            aria-label="Buscar na lista"
          >
            <span className="material-symbols-rounded text-base" aria-hidden="true">
              search
            </span>
          </button>
          <span className="text-xs text-slate-300">{list.length} filme(s)</span>
        </div>
      </div>

      <div className="list-dual-selects mt-3 grid gap-3 sm:grid-cols-2">
        <GlassSelect
          value={activeListId}
          onChange={(nextValue) => {
            setActiveListId(nextValue);
            void loadList(nextValue);
          }}
          options={userListOptions}
          placeholder="Selecionar lista"
        />
        <GlassSelect
          value={listSort}
          onChange={(nextValue) => setListSort(nextValue as ListSort)}
          options={LIST_SORT_OPTIONS}
        />
      </div>

      {showListSearch ? (
        <div className="mt-3">
          <input
            className="glass-input w-full"
            value={listSearchQuery}
            onChange={(event) => setListSearchQuery(event.target.value)}
            placeholder="Buscar nesta lista"
          />
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {loadingList ? (
          Array.from({ length: 4 }).map((_, index) => (
            <article key={`list-skeleton-${index}`} className="glass-tile p-3">
              <div className="flex items-center gap-3">
                <div className="skeleton h-14 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="skeleton h-4 w-3/4 rounded-md" />
                </div>
              </div>
            </article>
          ))
        ) : filteredList.length === 0 ? (
          <p className="text-sm text-slate-100">
            {list.length === 0
              ? "Esta lista esta vazia. Adicione filmes pelo painel de busca."
              : "Nenhum filme encontrado na busca desta lista."}
          </p>
        ) : (
          filteredList.map((item) => (
            <article key={item.movie_id} className="glass-tile flex items-center gap-3 p-3">
              <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-black/30">
                {item.poster_path ? (
                  <img src={posterUrl(item.poster_path)} alt={item.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
                  disabled={busyAction === item.movie_id}
                  onClick={() => setPendingRemoveMovie(item)}
                  type="button"
                  aria-label={`Remover ${item.title}`}
                >
                  <span className="material-symbols-rounded text-base" aria-hidden="true">
                    delete
                  </span>
                </button>
                <Link
                  href={`/filme/${item.movie_id}`}
                  className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
                  aria-label={`Ver detalhes de ${item.title}`}
                >
                  <span className="material-symbols-rounded text-base" aria-hidden="true">
                    info
                  </span>
                </Link>
              </div>
            </article>
          ))
        )}
      </div>

      <ActionDialog
        open={listNameDialogOpen}
        mode="prompt"
        title={listNameDialogMode === "create" ? "Nova lista" : "Editar nome da lista"}
        description="Defina um nome para sua lista."
        confirmText={listNameDialogMode === "create" ? "Criar" : "Salvar"}
        value={listNameInput}
        onValueChange={setListNameInput}
        confirmDisabled={!listNameInput.trim()}
        confirmLoading={savingListName}
        onClose={() => setListNameDialogOpen(false)}
        onConfirm={() => void submitListNameDialog()}
      />

      <ActionDialog
        open={deletingList}
        mode="confirm"
        title="Excluir lista"
        description={activeList ? `Tem certeza que deseja excluir "${activeList.name}"?` : "Tem certeza?"}
        confirmText="Excluir"
        tone="danger"
        onClose={() => setDeletingList(false)}
        onConfirm={() => void confirmDeleteList()}
      />

      <ActionDialog
        open={Boolean(pendingRemoveMovie)}
        mode="confirm"
        title="Remover filme"
        description={
          pendingRemoveMovie
            ? `Deseja remover "${pendingRemoveMovie.title}" desta lista?`
            : "Deseja remover este filme?"
        }
        confirmText="Remover"
        tone="danger"
        onClose={() => setPendingRemoveMovie(null)}
        onConfirm={() => {
          if (!pendingRemoveMovie) return;
          const movieId = pendingRemoveMovie.movie_id;
          setPendingRemoveMovie(null);
          void removeMovieNow(movieId);
        }}
      />
    </aside>
  );
}
