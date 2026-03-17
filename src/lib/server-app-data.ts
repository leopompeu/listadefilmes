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

export type MovieInteractionRecord = {
  movie_id: number;
  watched: boolean;
  liked: boolean;
  rating: number | null;
  comment: string | null;
};

export type MovieWatchedUser = {
  user_id: string;
  username: string;
  photo_url: string | null;
  rating: number | null;
  liked: boolean;
  comment: string | null;
};

export type MovieInteractionsState = {
  currentUserInteraction: MovieInteractionRecord | null;
  watchedByUsers: MovieWatchedUser[];
};

export type LikedMovieItem = {
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  rating: number | null;
  comment: string | null;
  updated_at: string;
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

export async function getMovieInteractionsState(movieId: number, currentUserId?: string) {
  const supabase = getSupabaseServerClient();

  const [{ data: watchedRows }, currentUserResult] = await Promise.all([
    supabase
      .from("user_movie_interactions")
      .select("user_id, rating, liked, comment, app_users!inner(username, photo_url)")
      .eq("movie_id", movieId)
      .eq("watched", true)
      .order("updated_at", { ascending: false }),
    currentUserId
      ? supabase
          .from("user_movie_interactions")
          .select("movie_id, watched, liked, rating, comment")
          .eq("user_id", currentUserId)
          .eq("movie_id", movieId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const watchedByUsers: MovieWatchedUser[] = (watchedRows ?? []).map((row) => {
    const userData = Array.isArray(row.app_users) ? row.app_users[0] : row.app_users;
    return {
      user_id: row.user_id as string,
      username: (userData?.username as string | undefined) ?? "",
      photo_url: (userData?.photo_url as string | null | undefined) ?? null,
      rating: (row.rating as number | null | undefined) ?? null,
      liked: Boolean(row.liked),
      comment: (row.comment as string | null | undefined) ?? null,
    };
  });

  return {
    currentUserInteraction: (currentUserResult.data as MovieInteractionRecord | null) ?? null,
    watchedByUsers,
  };
}

export async function getUserLikedMovies(userId: string) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("user_movie_interactions")
    .select("movie_id, title, poster_path, release_date, vote_average, rating, comment, updated_at")
    .eq("user_id", userId)
    .eq("liked", true)
    .order("updated_at", { ascending: false });

  return (data ?? []) as LikedMovieItem[];
}
