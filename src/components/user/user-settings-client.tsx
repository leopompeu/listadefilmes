/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/password-field";

type Props = {
  user: {
    username: string;
    photo_url: string | null;
  };
};

export function UserSettingsClient({ user }: Props) {
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState(user.photo_url);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  const userInitial = useMemo(() => user.username.slice(0, 1).toUpperCase(), [user.username]);

  async function onPhotoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoFile) {
      setPhotoStatus("Selecione uma foto antes de salvar.");
      return;
    }

    setPhotoLoading(true);
    setPhotoStatus("");

    const form = new FormData();
    form.append("photo", photoFile);

    const response = await fetch("/api/session/photo", {
      method: "POST",
      body: form,
    });

    const data = (await response.json()) as {
      error?: string;
      user?: { photo_url: string | null };
    };

    if (!response.ok) {
      setPhotoStatus(data.error ?? "Falha ao atualizar foto.");
      setPhotoLoading(false);
      return;
    }

    setPhotoUrl(data.user?.photo_url ?? null);
    setPhotoFile(null);
    setPhotoStatus("Foto atualizada com sucesso.");
    setPhotoLoading(false);
    router.refresh();
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus("");

    if (newPassword.length < 6) {
      setPasswordStatus("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus("As senhas nao conferem.");
      return;
    }

    setPasswordLoading(true);

    const response = await fetch("/api/session/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = (await response.json()) as { error?: string; ok?: boolean };
    if (!response.ok || !data.ok) {
      setPasswordStatus(data.error ?? "Falha ao atualizar senha.");
      setPasswordLoading(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordStatus("Senha atualizada com sucesso.");
    setPasswordLoading(false);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="glass-panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Foto de perfil</h2>
        <p className="mt-1 text-sm text-slate-300">Troque sua foto para personalizar seu perfil.</p>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/35 bg-white/15">
            {photoUrl ? (
              <img src={photoUrl} alt={`${user.username} avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                {userInitial}
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{user.username}</p>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onPhotoSubmit}>
          <label className="glass-input ui-file-upload block cursor-pointer text-sm">
            Escolher nova foto (JPG, PNG, WEBP)
            <input
              type="file"
              className="mt-2 block w-full text-xs"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="liquid-button w-full" disabled={photoLoading}>
            {photoLoading ? "Salvando..." : "Salvar foto"}
          </button>
          {photoStatus ? <p className="text-sm text-slate-200">{photoStatus}</p> : null}
        </form>
      </article>

      <article className="glass-panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Senha</h2>
        <p className="mt-1 text-sm text-slate-300">Atualize sua senha quando precisar.</p>

        <form className="mt-4 space-y-3" onSubmit={onPasswordSubmit}>
          <PasswordField
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Senha atual"
            required
            autoComplete="current-password"
          />
          <PasswordField
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nova senha"
            required
            autoComplete="new-password"
          />
          <PasswordField
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            placeholder="Confirmar nova senha"
            required
            autoComplete="new-password"
          />

          <button type="submit" className="liquid-button w-full" disabled={passwordLoading}>
            {passwordLoading ? "Atualizando..." : "Atualizar senha"}
          </button>
          {passwordStatus ? <p className="text-sm text-slate-200">{passwordStatus}</p> : null}
        </form>
      </article>
    </section>
  );
}
