"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "cadastro";

export function AuthPanelClient() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [status, setStatus] = useState("");

  const onAuthSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
      const data = (await response.json()) as {
        user?: { id: string; username: string; photo_url: string | null };
        error?: string;
      };

      if (!response.ok || !data.user) {
        setStatus(data.error ?? "Falha na autenticacao.");
        setLoadingAuth(false);
        return;
      }

      if (profilePhoto && authMode === "cadastro") {
        const form = new FormData();
        form.append("photo", profilePhoto);
        await fetch("/api/session/photo", { method: "POST", body: form });
      }

      setLoadingAuth(false);
      router.refresh();
    },
    [authMode, confirmPassword, password, profilePhoto, router, username],
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <article className="glass-panel p-6 md:p-8">
          <p className="ui-accent-pill px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
            0 to 1 list
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-5xl">
            Track movies.
            <br />
            Share taste.
            <br />
            Build your vibe.
          </h2>
          <p className="mt-4 max-w-xl text-sm text-slate-100 md:text-base">
            Login, discover movies, and grow your personal list in seconds.
          </p>
        </article>

        <article className="glass-panel p-6 md:p-8">
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
              <>
                <input
                  className="glass-input w-full"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirmar senha"
                  type="password"
                  maxLength={72}
                  required
                />
                <label className="glass-input ui-file-upload block cursor-pointer text-sm">
                  Foto de perfil opcional (JPG, PNG, WEBP)
                  <input
                    type="file"
                    className="mt-2 block w-full text-xs"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            ) : null}

            <button className="liquid-button w-full" type="submit" disabled={loadingAuth}>
              {loadingAuth ? "Carregando..." : authMode === "login" ? "Entrar" : "Criar conta"}
            </button>

            {status ? <p className="text-sm text-slate-200">{status}</p> : null}
          </form>
        </article>
      </div>
    </section>
  );
}
