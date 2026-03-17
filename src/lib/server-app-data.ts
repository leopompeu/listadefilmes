import { getSessionUsername } from "@/lib/sessions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type SessionUser = {
  id: string;
  username: string;
  photo_url: string | null;
};

export type UserListSummary = {
  id: string;
  name: string;
};

export type UserMovieItem = {
  list_id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  added_at: string;
};

export async function getCurrentSessionUser() {
  const username = await getSessionUsername();
  if (!username) return null;

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("app_users")
    .select("id, username, photo_url")
    .eq("username", username)
    .maybeSingle();

  return (data as SessionUser | null) ?? null;
}

export async function ensureDefaultList(userId: string) {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("user_lists")
    .select("id, name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (existing && existing.length > 0) {
    return existing as UserListSummary[];
  }

  const { data: created } = await supabase
    .from("user_lists")
    .insert({ user_id: userId, name: "Minha Lista" })
    .select("id, name")
    .single();

  return created ? ([created] as UserListSummary[]) : [];
}

export async function getUserListState(userId: string, requestedListId?: string) {
  const supabase = getSupabaseServerClient();
  const lists = await ensureDefaultList(userId);
  const activeListId =
    requestedListId && lists.some((entry) => entry.id === requestedListId)
      ? requestedListId
      : (lists[0]?.id ?? "");

  if (!activeListId) {
    return { lists: [] as UserListSummary[], items: [] as UserMovieItem[], activeListId: "" };
  }

  const { data: items } = await supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", userId)
    .eq("list_id", activeListId)
    .order("added_at", { ascending: false });

  return {
    lists,
    items: (items ?? []) as UserMovieItem[],
    activeListId,
  };
}

export async function getOtherUsers(currentUsername: string) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("app_users")
    .select("username, photo_url")
    .neq("username", currentUsername)
    .order("created_at", { ascending: false });

  return (data ?? []) as Array<{ username: string; photo_url: string | null }>;
}
