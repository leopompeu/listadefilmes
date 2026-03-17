/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AuthPanelClient } from "@/components/home/auth-panel-client";
import { ListManagerClient } from "@/components/home/list-manager-client";
import { LogoutButton } from "@/components/home/logout-button";
import { MovieBrowserClient } from "@/components/home/movie-browser-client";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getCurrentSessionUser, getOtherUsers, getUserListState } from "@/lib/server-app-data";
import { addDirectorsToMovies, discoverMovies, getMovieGenres } from "@/lib/tmdb";

export default async function HomePage() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return (
      <main className="min-h-screen px-2 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
        <div className="mx-auto w-full max-w-7xl">
          <AuthPanelClient />
        </div>
      </main>
    );
  }

  const [initialListState, genresResponse, discoverResponse, otherUsers] = await Promise.all([
    getUserListState(user.id),
    getMovieGenres(),
    discoverMovies({ page: 1, sortBy: "popularity.desc", includeAdult: false }),
    getOtherUsers(user.username),
  ]);

  const initialMovies = await addDirectorsToMovies(discoverResponse.results ?? []);

  return (
    <main className="min-h-screen px-3 py-6 pb-28 pt-24 sm:px-4 md:px-10 md:py-8 md:pb-8 md:pt-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="brand-strip mb-1 md:hidden">
          <div className="brand-header brand-header-centered">
            <img src="/logo.svg" alt="Logo Caralho Flix" className="brand-logo brand-logo-hero" />
            <h1 className="brand-mark text-3xl md:text-5xl">CARALHO FLIX</h1>
          </div>
        </section>

        <section className="glass-shell mb-6 hidden items-center px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr]">
          <Link href="/usuario" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/35 bg-white/15">
              {user.photo_url ? (
                <img src={user.photo_url} alt={`${user.username} avatar`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white">
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[0.64rem] uppercase tracking-[0.18em] text-slate-300">perfil logado</p>
              <p className="truncate text-sm font-semibold text-white">{user.username}</p>
            </div>
          </Link>

          <div className="brand-header brand-header-centered">
            <img src="/logo.svg" alt="Logo Caralho Flix" className="brand-logo" />
            <h1 className="brand-mark text-3xl">CARALHO FLIX</h1>
          </div>

          <div className="flex justify-end">
            <LogoutButton className="glass-secondary h-10 px-4 text-sm" />
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
                    <img src={otherUser.photo_url} alt={otherUser.username} className="h-full w-full object-cover" />
                  ) : (
                    <span>{otherUser.username.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <span className="users-side-name">{otherUser.username}</span>
              </Link>
            ))}
            {!otherUsers.length ? <p className="users-side-empty">Sem outros usuarios</p> : null}
          </div>
        </aside>

        <section className="user-top-header md:hidden">
          <Link href="/usuario" className="flex items-center gap-3">
            <div className="user-top-avatar">
              {user.photo_url ? (
                <img src={user.photo_url} alt={`${user.username} avatar`} className="h-full w-full object-cover" />
              ) : (
                <span>{user.username.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-slate-300">perfil logado</p>
              <p className="truncate text-lg font-semibold text-white">{user.username}</p>
            </div>
          </Link>
          <LogoutButton className="glass-secondary h-10 px-4 text-sm" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <MovieBrowserClient
            initialMovies={initialMovies}
            genres={genresResponse.genres ?? []}
            initialItems={initialListState.items}
            initialLists={initialListState.lists}
            initialActiveListId={initialListState.activeListId}
          />
          <div className="hidden lg:block">
            <ListManagerClient
              initialItems={initialListState.items}
              initialLists={initialListState.lists}
              initialActiveListId={initialListState.activeListId}
            />
          </div>
        </section>

        <MobileBottomNav active="home" />
      </div>
    </main>
  );
}
