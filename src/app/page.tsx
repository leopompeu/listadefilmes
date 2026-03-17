/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassSelect } from "@/components/glass-select";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

type AppUser = {
  id: string;
  username: string;
  photo_url: string | null;
};

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
};

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

type Genre = {
  id: number;
  name: string;
};

type FilterState = {
  sortBy: string;
  genreId: string;
  year: string;
  minVote: string;
  includeAdult: boolean;
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

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "cadastro">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [, setStatus] = useState("Carregando sessao...");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [list, setList] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "popularity.desc",
    genreId: "",
    year: "",
    minVote: "",
    includeAdult: false,
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    sortBy: "popularity.desc",
    genreId: "",
    year: "",
    minVote: "",
    includeAdult: false,
  });
  const [page, setPage] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [busyAction, setBusyAction] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [, setUploadingPhoto] = useState(false);
  const [otherUsers, setOtherUsers] = useState<OtherUser[]>([]);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const movieInList = useMemo(() => {
    return new Set(list.map((item) => item.movie_id));
  }, [list]);

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent || "";
      const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        ua,
      );
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobileDevice(isMobileUa && hasTouch);
    };

    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadList();
    void loadGenres();
    void loadOtherUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadMovies(activeQuery, page, appliedFilters);
  }, [user, page, activeQuery, appliedFilters]);

  async function loadSession() {
    try {
      const response = await fetch("/api/session");
      const data = (await response.json()) as { user: AppUser | null };
      setUser(data.user);
      if (data.user) {
        setStatus(`Bem-vindo de volta, ${data.user.username}.`);
      } else {
        setStatus("Faca login ou cadastre sua conta.");
      }
    } catch {
      setStatus("Nao foi possivel carregar sua sessao.");
    } finally {
      setBooting(false);
    }
  }

  async function loadGenres() {
    const response = await fetch("/api/movies/genres");
    const data = (await response.json()) as { genres?: Genre[] };
    setGenres(data.genres ?? []);
  }

  async function loadList() {
    const response = await fetch("/api/list");
    const data = (await response.json()) as { items: ListItem[] };
    setList(data.items ?? []);
  }

  async function loadOtherUsers() {
    const response = await fetch("/api/users");
    const data = (await response.json()) as { users?: OtherUser[] };
    setOtherUsers(data.users ?? []);
  }

  async function loadMovies(search: string, targetPage: number, currentFilters: FilterState) {
    setLoadingMovies(true);
    try {
      const searchTrimmed = search.trim();
      const endpoint = searchTrimmed
        ? `/api/movies/search?q=${encodeURIComponent(search)}&page=${targetPage}`
        : `/api/movies/discover?page=${targetPage}&sortBy=${encodeURIComponent(
            currentFilters.sortBy,
          )}&withGenres=${encodeURIComponent(currentFilters.genreId)}&year=${encodeURIComponent(
            currentFilters.year,
          )}&minVote=${encodeURIComponent(
            currentFilters.minVote,
          )}&includeAdult=${currentFilters.includeAdult}`;
      const response = await fetch(endpoint);
      const data = (await response.json()) as { results: Movie[] };
      setMovies(data.results ?? []);
    } finally {
      setLoadingMovies(false);
    }
  }

  async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingAuth(true);

    const clean = username.trim();
    if (clean.length < 2) {
      setStatus("Usuario precisa ter ao menos 2 caracteres.");
      setLoadingAuth(false);
      return;
    }

    if (password.length < 6) {
      setStatus("Senha precisa ter ao menos 6 caracteres.");
      setLoadingAuth(false);
      return;
    }

    if (authMode === "cadastro" && password !== confirmPassword) {
      setStatus("As senhas nao conferem.");
      setLoadingAuth(false);
      return;
    }

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean, password }),
    });

    const data = (await response.json()) as { user?: AppUser; error?: string };
    if (!response.ok || !data.user) {
      setStatus(data.error ?? "Falha na autenticacao.");
      setLoadingAuth(false);
      return;
    }

    setUser(data.user);
    setStatus(
      authMode === "login"
        ? `Login realizado para ${data.user.username}.`
        : `Conta criada para ${data.user.username}.`,
    );
    setUsername("");
    setPassword("");
    setConfirmPassword("");

    if (profilePhoto && authMode === "cadastro") {
      await uploadPhoto(profilePhoto);
      setProfilePhoto(null);
    }
    setLoadingAuth(false);
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("photo", file);

      const response = await fetch("/api/session/photo", {
        method: "POST",
        body: form,
      });

      const data = (await response.json()) as { user?: AppUser; error?: string };
      if (!response.ok || !data.user) {
        setStatus(data.error ?? "Falha ao enviar foto.");
        return;
      }

      setUser(data.user);
      setStatus("Foto atualizada com sucesso.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    setUser(null);
    setList([]);
    setOtherUsers([]);
    setMovies([]);
    setStatus("Sessao encerrada.");
  }

  async function addMovie(movie: Movie) {
    setBusyAction(movie.id);
    const response = await fetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
      }),
    });
    const data = (await response.json()) as { items: ListItem[]; error?: string };
    setBusyAction(null);

    if (!response.ok) {
      setStatus(data.error ?? "Falha ao adicionar filme.");
      return;
    }

    setList(data.items ?? []);
  }

  async function removeMovie(movieId: number) {
    setBusyAction(movieId);
    const response = await fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId }),
    });
    const data = (await response.json()) as { items: ListItem[]; error?: string };
    setBusyAction(null);

    if (!response.ok) {
      setStatus(data.error ?? "Falha ao remover filme.");
      return;
    }

    setList(data.items ?? []);
  }

  async function searchNow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveQuery(query.trim());
    setPage(1);
  }

  function applyFilters() {
    setActiveQuery("");
    setQuery("");
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    const cleanFilters = {
      sortBy: "popularity.desc",
      genreId: "",
      year: "",
      minVote: "",
      includeAdult: false,
    };
    setFilters(cleanFilters);
    setAppliedFilters(cleanFilters);
    setPage(1);
  }

  function previousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function nextPage() {
    setPage((current) => current + 1);
  }

  if (booting) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="glass-panel w-full max-w-md p-8 text-center">
          <div className="brand-header justify-center">
            <img src="/logo.svg" alt="Logo Caralho Flix" className="brand-logo" />
            <p className="brand-mark text-3xl">CARALHO FLIX DB</p>
          </div>
          <p className="mt-4 text-sm text-slate-200">Preparando sua experiencia...</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="shimmer-track h-full w-1/2 rounded-full" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8 ${
        user ? "pt-24 md:pt-8" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-7xl">
        {!user || isMobileDevice ? (
          <section className="brand-strip mb-1 md:hidden">
            <div className="brand-header brand-header-centered">
              <img src="/logo.svg" alt="Logo Caralho Flix" className="brand-logo brand-logo-hero" />
              <h1 className="brand-mark text-3xl md:text-5xl">CARALHO FLIX</h1>
            </div>
          </section>
        ) : null}

        {!user ? (
          <section className="glass-panel mx-auto max-w-xl p-6 md:p-8">
            <div className="auth-switch inline-flex" data-mode={authMode}>
              <button
                className="auth-tab"
                data-active={authMode === "login"}
                onClick={() => setAuthMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className="auth-tab"
                data-active={authMode === "cadastro"}
                onClick={() => setAuthMode("cadastro")}
                type="button"
              >
                Cadastro
              </button>
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              {authMode === "login" ? "Entrar na conta" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm text-slate-100">
              {authMode === "login"
                ? "Entre para acessar sua lista pessoal."
                : "Crie conta com usuario unico e senha."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onAuthSubmit}>
              <input
                className="glass-input w-full"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Usuário"
                maxLength={40}
                required
              />

              <input
                className="glass-input w-full"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha"
                type="password"
                maxLength={72}
                required
              />

              {authMode === "cadastro" ? (
                <input
                  className="glass-input w-full"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirmar senha"
                  type="password"
                  maxLength={72}
                  required
                />
              ) : null}

              {authMode === "cadastro" ? (
                <label className="glass-input block cursor-pointer text-sm text-slate-200">
                  Foto de perfil opcional (JPG, PNG, WEBP)
                  <input
                    type="file"
                    className="mt-2 block w-full text-xs text-slate-300 file:mr-4 file:rounded-full file:border file:border-white/30 file:bg-white/15 file:px-3 file:py-1 file:text-xs file:text-white"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)}
                  />
                </label>
              ) : null}

              <button className="liquid-button w-full" type="submit" disabled={loadingAuth}>
                {loadingAuth
                  ? "Carregando..."
                  : authMode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="glass-shell mb-6 hidden items-center px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-white/35 bg-white/15">
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={`${user.username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white">
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.64rem] uppercase tracking-[0.18em] text-slate-300">
                    perfil logado
                  </p>
                  <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                </div>
              </div>

              <div className="brand-header brand-header-centered">
                <img src="/logo.svg" alt="Logo Caralho Flix" className="brand-logo" />
                <h1 className="brand-mark text-3xl">CARALHO FLIX</h1>
              </div>

              <div className="flex justify-end">
                <button className="glass-secondary h-10 px-4 text-sm" onClick={logout} type="button">
                  Sair
                </button>
              </div>
            </section>

            <aside className="users-side-menu hidden lg:flex">
              <p className="users-side-title">Usuarios</p>
              <div className="users-side-list">
                {otherUsers.map((otherUser) => (
                  <Link
                    key={otherUser.username}
                    className="users-side-item"
                    href={`/usuarios/${encodeURIComponent(otherUser.username)}`}
                  >
                    <div className="users-side-avatar">
                      {otherUser.photo_url ? (
                        <img
                          src={otherUser.photo_url}
                          alt={otherUser.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{otherUser.username.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="users-side-name">{otherUser.username}</span>
                  </Link>
                ))}
                {!otherUsers.length ? (
                  <p className="users-side-empty">Sem outros usuarios</p>
                ) : null}
              </div>
            </aside>

            <section className="user-top-header md:hidden">
              <div className="flex items-center gap-3">
                <div className="user-top-avatar">
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={`${user.username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user.username.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-slate-300">
                    perfil logado
                  </p>
                  <p className="truncate text-lg font-semibold text-white">{user.username}</p>
                </div>
              </div>
              <button className="glass-secondary h-10 px-4 text-sm" onClick={logout} type="button">
                Sair
              </button>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              <div className="glass-panel p-5">
                <form className="flex gap-3" onSubmit={searchNow}>
                  <input
                    className="glass-input w-full"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar filme no TMDB"
                  />
                  <button className="liquid-button px-5" type="submit">
                    Buscar
                  </button>
                </form>

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
                      onChange={(nextValue) =>
                        setFilters((current) => ({ ...current, sortBy: nextValue }))
                      }
                      options={[
                        { value: "popularity.desc", label: "Popularidade (maior)" },
                        { value: "popularity.asc", label: "Popularidade (menor)" },
                        { value: "release_date.desc", label: "Lancamento (mais novo)" },
                        { value: "release_date.asc", label: "Lancamento (mais antigo)" },
                        { value: "vote_average.desc", label: "Nota (maior)" },
                        { value: "vote_average.asc", label: "Nota (menor)" },
                      ]}
                    />

                    <GlassSelect
                      value={filters.genreId}
                      onChange={(nextValue) =>
                        setFilters((current) => ({ ...current, genreId: nextValue }))
                      }
                      options={[
                        { value: "", label: "Todos os generos" },
                        ...genres.map((genre) => ({
                          value: String(genre.id),
                          label: genre.name,
                        })),
                      ]}
                    />

                    <input
                      className="glass-input w-full"
                      value={filters.year}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, year: event.target.value }))
                      }
                      placeholder="Ano (ex: 2024)"
                      inputMode="numeric"
                      maxLength={4}
                    />

                    <input
                      className="glass-input w-full"
                      value={filters.minVote}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, minVote: event.target.value }))
                      }
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
                    <button className="liquid-button px-4 text-sm" onClick={applyFilters} type="button">
                      Aplicar filtros
                    </button>
                    <button className="glass-secondary px-4 py-2 text-sm" onClick={clearFilters} type="button">
                      Limpar filtros
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                  <p>
                    {activeQuery
                      ? `Resultados para "${activeQuery}"`
                      : "Discover com filtros do TMDB"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="glass-secondary h-8 w-8"
                      onClick={previousPage}
                      type="button"
                      aria-label="Pagina anterior"
                    >
                      ←
                    </button>
                    <span>Pagina {page}</span>
                    <button
                      className="glass-secondary h-8 w-8"
                      onClick={nextPage}
                      type="button"
                      aria-label="Proxima pagina"
                    >
                      →
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
                          <div className="mt-3 min-h-[4.3rem]">
                            <h3 className="line-clamp-2 text-sm font-semibold text-white">
                              {movie.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-300">
                              {formatDate(movie.release_date)} ·{" "}
                              {movie.vote_average?.toFixed(1) ?? "-"}
                            </p>
                          </div>
                          <button
                            className="liquid-button mt-auto w-full text-sm"
                            disabled={busyAction === movie.id || movieInList.has(movie.id)}
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

                <div className="mt-5 flex items-center justify-end gap-2 text-xs text-slate-300">
                  <button
                    className="glass-secondary h-8 w-8"
                    onClick={previousPage}
                    type="button"
                    aria-label="Pagina anterior (rodape)"
                  >
                    ←
                  </button>
                  <span>Pagina {page}</span>
                  <button
                    className="glass-secondary h-8 w-8"
                    onClick={nextPage}
                    type="button"
                    aria-label="Proxima pagina (rodape)"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            <aside className="glass-panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Minha Lista</h2>
                <span className="text-xs text-slate-300">{list.length} filme(s)</span>
              </div>

              <div className="mt-4 space-y-3">
                {list.length === 0 ? (
                  <p className="text-sm text-slate-100">
                    Sua lista esta vazia. Adicione filmes pelo painel de busca.
                  </p>
                ) : (
                  list.map((item) => (
                    <article
                      key={item.movie_id}
                      className="glass-tile flex items-center gap-3 p-3"
                    >
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
                          disabled={busyAction === item.movie_id}
                          onClick={() => void removeMovie(item.movie_id)}
                          type="button"
                        >
                          Remover
                        </button>
                        <Link
                          href={`/filme/${item.movie_id}`}
                          className="glass-secondary inline-flex h-8 items-center justify-center px-3 text-xs"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </section>

          <MobileBottomNav active="home" />
          </>
        )}
      </div>
    </main>
  );
}
