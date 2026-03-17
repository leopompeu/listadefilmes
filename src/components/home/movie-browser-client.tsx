/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassSelect } from "@/components/glass-select";
import { FilterState, Genre, ListItem, Movie, UserList } from "@/components/home/types";
import { LISTS_UPDATED_EVENT, ListsUpdatedPayload } from "@/components/home/list-events";

const DEFAULT_FILTERS: FilterState = {
  sortBy: "popularity.desc",
  genreId: "",
  year: "",
  minVote: "",
  includeAdult: false,
};

const DISCOVER_SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularidade (maior)" },
  { value: "popularity.asc", label: "Popularidade (menor)" },
  { value: "release_date.desc", label: "Lancamento (mais novo)" },
  { value: "release_date.asc", label: "Lancamento (mais antigo)" },
  { value: "vote_average.desc", label: "Nota (maior)" },
  { value: "vote_average.asc", label: "Nota (menor)" },
];

function posterUrl(path: string | null) {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

function formatYear(date: string | null | undefined) {
  if (!date) return "-";
  const [year] = date.split("-");
  return year && year.length === 4 ? year : "-";
}

type Props = {
  initialMovies: Movie[];
  genres: Genre[];
  initialItems: ListItem[];
  initialLists: UserList[];
  initialActiveListId: string;
};

export function MovieBrowserClient({
  initialMovies,
  genres,
  initialItems,
  initialLists,
  initialActiveListId,
}: Props) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [list, setList] = useState<ListItem[]>(initialItems);
  const [lists, setLists] = useState<UserList[]>(initialLists);
  const [activeListId, setActiveListId] = useState(initialActiveListId);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [busyAction, setBusyAction] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const movieInList = useMemo(() => new Set(list.map((item) => item.movie_id)), [list]);

  const genreFilterOptions = useMemo(
    () => [
      { value: "", label: "Todos os generos" },
      ...genres.map((genre) => ({
        value: String(genre.id),
        label: genre.name,
      })),
    ],
    [genres],
  );

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

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = query.trim();
      setPage(1);
      setActiveQuery((current) => (current === nextQuery ? current : nextQuery));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadMovies = useCallback(
    async (search: string, targetPage: number, currentFilters: FilterState) => {
      setLoadingMovies(true);
      try {
        const searchTrimmed = search.trim();
        const endpoint = searchTrimmed
          ? `/api/movies/search?q=${encodeURIComponent(searchTrimmed)}&page=${targetPage}`
          : `/api/movies/discover?page=${targetPage}&sortBy=${encodeURIComponent(
              currentFilters.sortBy,
            )}&withGenres=${encodeURIComponent(
              currentFilters.genreId,
            )}&year=${encodeURIComponent(currentFilters.year)}&minVote=${encodeURIComponent(
              currentFilters.minVote,
            )}&includeAdult=${currentFilters.includeAdult}`;
        const response = await fetch(endpoint);
        const data = (await response.json()) as { results?: Movie[] };
        setMovies(data.results ?? []);
      } finally {
        setLoadingMovies(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMovies(activeQuery, page, appliedFilters);
  }, [activeQuery, appliedFilters, loadMovies, page]);

  const addMovie = useCallback(
    async (movie: Movie) => {
      if (!activeListId) return;
      setBusyAction(movie.id);
      const response = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: activeListId,
          movieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          releaseDate: movie.release_date,
          voteAverage: movie.vote_average,
        }),
      });
      const data = (await response.json()) as {
        items?: ListItem[];
        lists?: UserList[];
        activeListId?: string | null;
      };
      setBusyAction(null);
      if (!response.ok) return;

      const payload: ListsUpdatedPayload = {
        items: data.items ?? [],
        lists: data.lists ?? lists,
        activeListId: data.activeListId ?? activeListId,
      };
      window.dispatchEvent(new CustomEvent<ListsUpdatedPayload>(LISTS_UPDATED_EVENT, { detail: payload }));
    },
    [activeListId, lists],
  );

  const onApplyFilters = useCallback(() => {
    setActiveQuery("");
    setQuery("");
    setPage(1);
    setAppliedFilters({ ...filters });
  }, [filters]);

  const onClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const previousPage = useCallback(() => setPage((current) => Math.max(1, current - 1)), []);
  const nextPage = useCallback(() => setPage((current) => current + 1), []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5">
        <div className="flex gap-3">
          <input
            className="glass-input w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar filme no TMDB"
          />
        </div>

        <div className="mt-3">
          <button
            className="glass-secondary h-10 px-4 text-sm"
            type="button"
            aria-expanded={showFilters}
            aria-controls="filters-panel"
            onClick={() => setShowFilters((current) => !current)}
          >
            {showFilters ? "Ocultar filtros" : "Ver filtros"}
          </button>
        </div>

        <div id="filters-panel" className="filters-collapse" data-open={showFilters}>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <GlassSelect
              value={filters.sortBy}
              onChange={(nextValue) => setFilters((current) => ({ ...current, sortBy: nextValue }))}
              options={DISCOVER_SORT_OPTIONS}
            />

            <GlassSelect
              value={filters.genreId}
              onChange={(nextValue) => setFilters((current) => ({ ...current, genreId: nextValue }))}
              options={genreFilterOptions}
            />

            <input
              className="glass-input w-full"
              value={filters.year}
              onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              placeholder="Ano (ex: 2024)"
              inputMode="numeric"
              maxLength={4}
            />

            <input
              className="glass-input w-full"
              value={filters.minVote}
              onChange={(event) => setFilters((current) => ({ ...current, minVote: event.target.value }))}
              placeholder="Nota minima (0 a 10)"
              inputMode="decimal"
              maxLength={4}
            />
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-100">
            <input
              className="glass-check"
              checked={filters.includeAdult}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  includeAdult: event.target.checked,
                }))
              }
              type="checkbox"
            />
            Incluir conteudo adulto
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="liquid-button px-4 text-sm" onClick={onApplyFilters} type="button">
              Aplicar filtros
            </button>
            <button className="glass-secondary px-4 py-2 text-sm" onClick={onClearFilters} type="button">
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
          <p>{activeQuery ? `Resultados para "${activeQuery}"` : "Discover com filtros do TMDB"}</p>
          <div className="flex items-center gap-2">
            <button
              className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
              onClick={previousPage}
              type="button"
              aria-label="Pagina anterior"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">
                chevron_left
              </span>
            </button>
            <span>Pagina {page}</span>
            <button
              className="glass-secondary inline-flex h-8 w-8 items-center justify-center p-0"
              onClick={nextPage}
              type="button"
              aria-label="Proxima pagina"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </div>
        </div>

        <div className="movie-grid mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loadingMovies
            ? Array.from({ length: 6 }).map((_, index) => (
                <article key={`skeleton-${index}`} className="movie-card glass-tile p-3">
                  <div className="skeleton aspect-[2/3] rounded-xl" />
                  <div className="skeleton mt-3 h-4 rounded-md" />
                  <div className="skeleton mt-2 h-3 w-3/4 rounded-md" />
                  <div className="skeleton mt-3 h-9 rounded-full" />
                </article>
              ))
            : movies.map((movie) => (
                <article key={movie.id} className="movie-card glass-tile flex h-full flex-col p-3">
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
                  <div className="mt-3 min-h-[5.8rem] space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                      {movie.title}
                    </h3>
                    <p className="line-clamp-1 text-xs text-slate-200">
                      {movie.director ?? "Nao informado"}
                    </p>
                    <p className="text-xs text-slate-300">
                      Ano {formatYear(movie.release_date)} · Nota {movie.vote_average?.toFixed(1) ?? "-"}
                    </p>
                  </div>
                  <button
                    className="liquid-button mt-auto w-full text-sm"
                    disabled={!activeListId || busyAction === movie.id || movieInList.has(movie.id)}
                    onClick={() => void addMovie(movie)}
                    type="button"
                  >
                    {movieInList.has(movie.id)
                      ? "Adicionado"
                      : busyAction === movie.id
                        ? "Salvando..."
                        : "Adicionar"}
                  </button>
                  <Link
                    href={`/filme/${movie.id}`}
                    className="glass-secondary mt-2 flex h-9 w-full items-center justify-center text-sm"
                  >
                    Ver detalhes
                  </Link>
                </article>
              ))}
        </div>
      </div>
    </div>
  );
}
