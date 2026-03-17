create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  movie_id integer not null,
  title text not null,
  poster_path text,
  release_date text,
  vote_average numeric(3, 1),
  added_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create index if not exists idx_user_movies_user_id on public.user_movies (user_id);
create index if not exists idx_user_movies_added_at on public.user_movies (added_at desc);

create table if not exists public.movie_streaming (
  id uuid primary key default gen_random_uuid(),
  movie_id integer not null,
  provider text not null,
  url text,
  added_by text not null,
  updated_at timestamptz not null default now(),
  unique (movie_id, provider)
);

create index if not exists idx_movie_streaming_movie_id on public.movie_streaming (movie_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
