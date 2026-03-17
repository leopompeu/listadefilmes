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
      </div>
    </main>
  );
}
