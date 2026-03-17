import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json({ error: "Faca login primeiro." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Foto obrigatoria." }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG ou WEBP." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Tamanho maximo de 5MB." }, { status: 400 });
    }

    const ext = file.type.split("/")[1] ?? "jpg";
    const filePath = `${username.replace(/\s+/g, "_")}/avatar.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseServerClient();
    const upload = await supabase.storage.from("avatars").upload(filePath, bytes, {
      contentType: file.type,
      upsert: true,
    });

    if (upload.error) {
      throw upload.error;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const photoUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    const { data: user, error } = await supabase
      .from("app_users")
      .update({ photo_url: photoUrl })
      .eq("username", username)
      .select("id, username, photo_url")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Falha ao enviar foto." }, { status: 500 });
  }
}
