import { ListManagerClient } from "@/components/home/list-manager-client";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getCurrentSessionUser, getUserListState } from "@/lib/server-app-data";

export default async function MyListPage() {
  const user = await getCurrentSessionUser();
  const initialState = user ? await getUserListState(user.id) : { lists: [], items: [], activeListId: "" };

  return (
    <main className="min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-5 p-5 md:mb-6 md:p-8">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Minhas Listas</h1>
          <p className="mt-2 text-sm text-slate-200">Organize seus filmes em listas personalizadas.</p>
          {user ? <p className="mt-2 text-xs text-slate-300">Logado como {user.username}</p> : null}
        </section>

        <ListManagerClient
          initialItems={initialState.items}
          initialLists={initialState.lists}
          initialActiveListId={initialState.activeListId}
        />

        <MobileBottomNav active="my-list" />
      </div>
    </main>
  );
}
