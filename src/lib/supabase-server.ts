import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export type AppUser = {
  id: string;
  username: string;
  password_hash: string;
  photo_url: string | null;
  created_at: string;
};

export type UserMovie = {
  id: string;
  user_id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  added_at: string;
};

export function getSupabaseServerClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
