/* eslint-disable @next/next/no-img-element */
"use client";

import type { MouseEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import type { MovieInteractionsState } from "@/lib/server-app-data";

type Props = {
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  canInteract: boolean;
  initialState: MovieInteractionsState;
};

function avatarFallback(username: string) {
  return username.slice(0, 1).toUpperCase();
}

function formatRating(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function StarIcon({ value, sizeClass }: { value: 0 | 0.5 | 1; sizeClass: string }) {
  const starPath = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
  const clipId = useId();
  return (
    <span className={`inline-block align-middle ${sizeClass}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-full w-full">
        {value === 1 ? (
          <path d={starPath} fill="#facc15" stroke="#facc15" strokeWidth="1.2" strokeLinejoin="round" />
        ) : value === 0.5 ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
            </defs>
            <path d={starPath} fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinejoin="round" />
            <path d={starPath} fill="#facc15" clipPath={`url(#${clipId})`} />
          </>
        ) : (
          <path d={starPath} fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

function LikeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="like-svg h-6 w-6" aria-hidden="true">
      {active ? (
        <path
          d="M1 21h4V9H1v12zm21-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13 1 6.59 7.41C6.22 7.78 6 8.3 6 8.83V19c0 1.1.9 2 2 2h9c.82 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M13.12 2.06 7.58 7.6c-.36.36-.58.86-.58 1.4v11c0 1.1.9 2 2 2h9c.8 0 1.52-.48 1.84-1.21l3.26-7.61c.06-.16.1-.34.1-.52V11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.12 2.06ZM9 20V9l3.34-3.34L11.2 11H21v1.61L17.99 20H9ZM1 9h4v12H1V9Z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

function renderStars(value: number) {
  return Array.from({ length: 5 }).map((_, idx) => {
    const starValue = idx + 1;
    const fillValue: 0 | 0.5 | 1 =
      value >= starValue ? 1 : value >= starValue - 0.5 ? 0.5 : 0;
    return <StarIcon key={idx} value={fillValue} sizeClass="h-4 w-4" />;
  });
}

export function MovieInteractionsPanel({
  movieId,
  movieTitle,
  posterPath,
  releaseDate,
  voteAverage,
  canInteract,
  initialState,
}: Props) {
  const [watched, setWatched] = useState(Boolean(initialState.currentUserInteraction?.watched));
  const [liked, setLiked] = useState(Boolean(initialState.currentUserInteraction?.liked));
  const [rating, setRating] = useState<number>(initialState.currentUserInteraction?.rating ?? 0);
  const [comment, setComment] = useState(initialState.currentUserInteraction?.comment ?? "");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [displayedUserId, setDisplayedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<MovieInteractionsState>(initialState);

  const expandedUser = useMemo(
    () => state.watchedByUsers.find((entry) => entry.user_id === expandedUserId) ?? null,
    [expandedUserId, state.watchedByUsers],
  );
  const displayedUser = useMemo(
    () => state.watchedByUsers.find((entry) => entry.user_id === displayedUserId) ?? null,
    [displayedUserId, state.watchedByUsers],
  );

  useEffect(() => {
    if (expandedUserId) {
      setDisplayedUserId(expandedUserId);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayedUserId(null);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [expandedUserId]);

  const getHalfStepValue = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? index + 0.5 : index + 1;
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/movies/${movieId}/interactions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watched: true,
          liked,
          rating,
          comment,
          title: movieTitle,
          posterPath,
          releaseDate,
          voteAverage,
        }),
      });
      const data = (await response.json()) as MovieInteractionsState & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel salvar.");
        return;
      }
      setWatched(true);
      setState(data);
      setPopupOpen(false);
    } catch {
      setError("Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 space-y-3">
      <article className="glass-tile p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Visto por:</p>
            <p className="text-xs text-slate-300">Clique em um usuario para ver a interacao dele.</p>
          </div>
          {canInteract ? (
            <button
              className={`glass-secondary inline-flex items-center gap-2 px-4 py-2 text-sm ${
                watched ? "border-red-400/70 bg-red-500/20" : ""
              }`}
              type="button"
              onClick={() => setPopupOpen(true)}
            >
              <span className="material-symbols-rounded text-base">visibility</span>
              {watched ? "Visto" : "Marcar como visto"}
            </button>
          ) : (
            <span className="text-xs text-slate-300">Faca login para interagir.</span>
          )}
        </div>

        {!state.watchedByUsers.length ? (
          <p className="mt-3 text-sm text-slate-200">Ainda ninguem marcou este filme como visto.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {state.watchedByUsers.map((entry) => (
              <button
                key={entry.user_id}
                type="button"
                onClick={() =>
                  setExpandedUserId((current) => (current === entry.user_id ? null : entry.user_id))
                }
                className={`h-11 w-11 overflow-hidden rounded-full border bg-white/15 ${
                  expandedUserId === entry.user_id ? "border-red-300" : "border-white/30"
                }`}
                aria-label={`Ver interacao de ${entry.username}`}
              >
                {entry.photo_url ? (
                  <img src={entry.photo_url} alt={entry.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white">
                    {avatarFallback(entry.username)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="smooth-collapse mt-3" data-open={Boolean(expandedUserId)}>
          {displayedUser ? (
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <p className="text-sm font-semibold text-white">{displayedUser.username}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-300">Nota:</span>
                <div className="inline-flex items-center">{renderStars(displayedUser.rating ?? 0)}</div>
                <span className="text-xs text-slate-300">{formatRating(displayedUser.rating ?? 0)}/5</span>
              </div>
              <p className="mt-2 text-xs text-slate-300">Curtiu: {displayedUser.liked ? "Sim" : "Nao"}</p>
              <p className="mt-2 text-xs text-slate-200">
                {displayedUser.comment?.trim() ? displayedUser.comment : "Sem comentario."}
              </p>
            </div>
          ) : (
            <div />
          )}
        </div>
      </article>

      {popupOpen ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true">
          <div className="dialog-shell">
            <h3 className="text-lg font-semibold text-white">Marcar como visto</h3>
            <p className="mt-1 text-xs text-slate-300">Adicione sua interacao com este filme.</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1" onMouseLeave={() => setHoveredStar(0)}>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const preview = hoveredStar || rating;
                  const starValue = idx + 1;
                  const fillValue: 0 | 0.5 | 1 =
                    preview >= starValue ? 1 : preview >= starValue - 0.5 ? 0.5 : 0;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      aria-label={`Dar nota ${starValue} estrela(s)`}
                      className="inline-flex h-9 w-9 items-center justify-center p-0"
                      onMouseMove={(event) => setHoveredStar(getHalfStepValue(idx, event))}
                      onClick={(event) => setRating(getHalfStepValue(idx, event))}
                    >
                      <StarIcon value={fillValue} sizeClass="h-7 w-7" />
                    </button>
                  );
                })}
                <button className="glass-secondary ml-2 px-3 py-1 text-xs" type="button" onClick={() => setRating(0)}>
                  Limpar
                </button>
              </div>
              <button
                type="button"
                onClick={() => setLiked((current) => !current)}
                className={`like-toggle-btn inline-flex h-9 w-9 items-center justify-center p-0 ${
                  liked ? "is-liked" : ""
                }`}
                aria-label={liked ? "Descurtir filme" : "Curtir filme"}
                title={liked ? "Curtido" : "Curtir"}
              >
                <LikeIcon active={liked} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-300">Sua nota: {formatRating(rating)}/5</p>

            <div className="mt-3">
              <textarea
                className="glass-input min-h-24 w-full resize-y"
                maxLength={500}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Escreva um comentario (maximo 500 caracteres)"
              />
              <p className="mt-1 text-right text-xs text-slate-300">{comment.length}/500</p>
            </div>

            {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="glass-secondary px-4 py-2 text-sm"
                type="button"
                onClick={() => {
                  setPopupOpen(false);
                  setError(null);
                }}
              >
                Cancelar
              </button>
              <button className="liquid-button px-4 py-2 text-sm" type="button" disabled={saving} onClick={() => void save()}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
