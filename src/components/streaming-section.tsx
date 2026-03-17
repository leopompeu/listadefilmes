/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { ActionDialog } from "@/components/action-dialog";
import { STREAMING_PROVIDERS, StreamingProviderId } from "@/lib/streaming";

type SessionUser = {
  id: string;
  username: string;
  photo_url: string | null;
};

type StreamingItem = {
  provider: StreamingProviderId;
  url: string | null;
  added_by: string;
  updated_at: string;
};

type Props = {
  movieId: number;
};

export function StreamingSection({ movieId }: Props) {
  const [items, setItems] = useState<StreamingItem[]>([]);
  const [provider, setProvider] = useState<StreamingProviderId>("netflix");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingProviderId, setRemovingProviderId] = useState<StreamingProviderId | null>(null);
  const [status, setStatus] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingRemoveProvider, setPendingRemoveProvider] = useState<{
    id: StreamingProviderId;
    label: string;
  } | null>(null);

  useEffect(() => {
    void loadSession();
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  async function loadSession() {
    const response = await fetch("/api/session");
    const data = (await response.json()) as { user: SessionUser | null };
    setSessionUser(data.user);
  }

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch(`/api/movies/${movieId}/streaming`);
      const data = (await response.json()) as { items?: StreamingItem[] };
      setItems((data.items ?? []) as StreamingItem[]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch(`/api/movies/${movieId}/streaming`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, url }),
      });

      const data = (await response.json()) as {
        items?: StreamingItem[];
        error?: string;
      };

      if (!response.ok) {
        setStatus(data.error ?? "Nao foi possivel salvar.");
        return;
      }

      setItems((data.items ?? []) as StreamingItem[]);
      setUrl("");
      setStatus("Streaming atualizado.");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeProvider(target: StreamingProviderId) {
    setSaving(true);
    setRemovingProviderId(target);
    setStatus("");
    try {
      const response = await fetch(`/api/movies/${movieId}/streaming`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: target }),
      });

      const data = (await response.json()) as {
        items?: StreamingItem[];
        error?: string;
      };

      if (!response.ok) {
        setStatus(data.error ?? "Nao foi possivel remover.");
        return;
      }

      setItems((data.items ?? []) as StreamingItem[]);
      setStatus("Streaming removido.");
    } finally {
      setRemovingProviderId(null);
      setSaving(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Onde assistir</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">{items.length} fonte(s)</span>
          {sessionUser ? (
            <button
              className="liquid-button inline-flex h-8 w-8 items-center justify-center p-0 text-base leading-none"
              type="button"
              onClick={() => setShowForm(true)}
              title="Adicionar streaming"
              aria-label="Adicionar streaming"
            >
              +
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-16 w-16 rounded-xl" />
          ))
        ) : items.length ? (
          items.map((item) => {
            const providerMeta = STREAMING_PROVIDERS.find((entry) => entry.id === item.provider);
            if (!providerMeta) return null;
            const targetUrl = item.provider === "piracy" ? item.url : providerMeta.homeUrl;

            return (
              <article key={item.provider} className="relative">
                {targetUrl ? (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-tile flex h-16 w-16 items-center justify-center p-2"
                    title={`${providerMeta.label} (por ${item.added_by})`}
                  >
                    <img
                      src={providerMeta.icon}
                      alt={providerMeta.label}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  </a>
                ) : (
                  <div
                    className="glass-tile flex h-16 w-16 items-center justify-center p-2"
                    title={`${providerMeta.label} (sem link)`}
                  >
                    <img
                      src={providerMeta.icon}
                      alt={providerMeta.label}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  </div>
                )}

                {sessionUser ? (
                  <button
                    className="absolute right-1 top-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[12px] leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    disabled={saving}
                    onClick={() => setPendingRemoveProvider({ id: item.provider, label: providerMeta.label })}
                    title={`Remover ${providerMeta.label}`}
                    aria-label={`Remover ${providerMeta.label}`}
                  >
                    {removingProviderId === item.provider ? "..." : "×"}
                  </button>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="text-sm text-slate-200">
            Ainda nao existe informacao de streaming para este filme.
          </p>
        )}
      </div>

      {!sessionUser ? (
        <div className="mt-5 glass-panel p-4">
          <h3 className="text-base font-semibold text-white">Adicionar ou editar streaming</h3>
          <p className="mt-2 text-sm text-slate-200">Faca login para editar as fontes.</p>
        </div>
      ) : (
        <div className="smooth-collapse mt-5" data-open={showForm}>
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-white">Adicionar ou editar streaming</h3>
              <button
                className="glass-secondary inline-flex h-7 w-7 items-center justify-center p-0 text-sm"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Fechar formulario"
                title="Fechar"
              >
                ×
              </button>
            </div>
            <form
              className={`mt-3 grid gap-3 ${
                provider === "piracy" ? "sm:grid-cols-[1fr_1.3fr_auto]" : "sm:grid-cols-[1fr_auto]"
              }`}
              onSubmit={onSubmit}
            >
              <div className="select-wrap">
                <select
                  className="glass-input glass-select w-full"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value as StreamingProviderId)}
                >
                  {STREAMING_PROVIDERS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>

              {provider === "piracy" ? (
                <input
                  className="glass-input w-full"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="Link obrigatorio para pirataria"
                />
              ) : null}

              <button className="liquid-button h-[46px] px-4 text-sm" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </form>
            {status ? <p className="mt-2 text-xs text-slate-200">{status}</p> : null}
          </div>
        </div>
      )}

      <ActionDialog
        open={Boolean(pendingRemoveProvider)}
        mode="confirm"
        title="Remover streaming"
        description={
          pendingRemoveProvider
            ? `Deseja remover ${pendingRemoveProvider.label} desta lista de streamings?`
            : "Deseja remover este streaming?"
        }
        confirmText="Remover"
        tone="danger"
        onClose={() => setPendingRemoveProvider(null)}
        onConfirm={() => {
          if (!pendingRemoveProvider) return;
          const providerId = pendingRemoveProvider.id;
          setPendingRemoveProvider(null);
          void removeProvider(providerId);
        }}
      />
    </section>
  );
}
