create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_lists_user_id on public.user_lists (user_id);
create index if not exists idx_user_lists_updated_at on public.user_lists (updated_at desc);

create table if not exists public.user_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  list_id uuid,
  movie_id integer not null,
  title text not null,
  poster_path text,
  release_date text,
  vote_average numeric(3, 1),
  added_at timestamptz not null default now(),
  unique (list_id, movie_id)
);

alter table public.user_movies
add column if not exists list_id uuid;

insert into public.user_lists (user_id, name)
select u.id, 'Minha Lista'
from public.app_users u
where not exists (
  select 1
  from public.user_lists l
  where l.user_id = u.id
);

update public.user_movies m
set list_id = l.id
from public.user_lists l
where l.user_id = m.user_id
  and m.list_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_movies_list_id_fkey'
  ) then
    alter table public.user_movies
    add constraint user_movies_list_id_fkey
    foreign key (list_id) references public.user_lists (id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'user_movies_user_id_movie_id_key'
  ) then
    alter table public.user_movies
    drop constraint user_movies_user_id_movie_id_key;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_movies_list_id_movie_id_key'
  ) then
    alter table public.user_movies
    add constraint user_movies_list_id_movie_id_key unique (list_id, movie_id);
  end if;
end
$$;

create index if not exists idx_user_movies_user_id on public.user_movies (user_id);
create index if not exists idx_user_movies_list_id on public.user_movies (list_id);
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
