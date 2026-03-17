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

type OtherUser = {
  username: string;
  photo_url: string | null;
};

export default function UsersPage() {
  const [sessionUser, setSessionUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<OtherUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sessionResponse, usersResponse] = await Promise.all([
        fetch("/api/session"),
        fetch("/api/users"),
      ]);

      const sessionData = (await sessionResponse.json()) as { user: AppUser | null };
      setSessionUser(sessionData.user);

      if (usersResponse.ok) {
        const usersData = (await usersResponse.json()) as { users?: OtherUser[] };
        setUsers(usersData.users ?? []);
      } else {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-5 p-5 md:mb-6 md:p-8">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Usuarios</h1>
          <p className="mt-2 text-sm text-slate-200">
            Acesse as listas publicas de outros usuarios.
          </p>
          {sessionUser ? (
            <p className="mt-2 text-xs text-slate-300">Logado como {sessionUser.username}</p>
          ) : null}
        </section>

        <section className="glass-panel p-5">
          {loading ? (
            <p className="text-sm text-slate-200">Carregando usuarios...</p>
          ) : users.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Link
                  key={user.username}
                  href={`/usuarios/${encodeURIComponent(user.username)}`}
                  className="glass-tile flex items-center gap-3 p-3"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-white/35 bg-white/15">
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-slate-300">Ver lista</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-200">Nenhum outro usuario encontrado.</p>
          )}
        </section>

        <MobileBottomNav active="users" />
      </div>
    </main>
  );
}
