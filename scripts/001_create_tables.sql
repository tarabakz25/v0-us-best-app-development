-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (references auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Ads table
create table if not exists public.ads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  brand text,
  media_url text not null,
  shop_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ads enable row level security;

create policy "ads_select_all"
  on public.ads for select
  using (true);

create policy "ads_insert_own"
  on public.ads for insert
  with check (auth.uid() = user_id);

create policy "ads_update_own"
  on public.ads for update
  using (auth.uid() = user_id);

create policy "ads_delete_own"
  on public.ads for delete
  using (auth.uid() = user_id);

-- Surveys table
create table if not exists public.surveys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  brand text,
  media_url text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.surveys enable row level security;

create policy "surveys_select_all"
  on public.surveys for select
  using (true);

create policy "surveys_insert_own"
  on public.surveys for insert
  with check (auth.uid() = user_id);

create policy "surveys_update_own"
  on public.surveys for update
  using (auth.uid() = user_id);

create policy "surveys_delete_own"
  on public.surveys for delete
  using (auth.uid() = user_id);

-- Remixes table
create table if not exists public.remixes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ad_id uuid references public.ads(id) on delete cascade,
  title text not null,
  description text not null,
  media_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.remixes enable row level security;

create policy "remixes_select_all"
  on public.remixes for select
  using (true);

create policy "remixes_insert_own"
  on public.remixes for insert
  with check (auth.uid() = user_id);

create policy "remixes_update_own"
  on public.remixes for update
  using (auth.uid() = user_id);

create policy "remixes_delete_own"
  on public.remixes for delete
  using (auth.uid() = user_id);

-- Likes table
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content_type text not null check (content_type in ('ad', 'remix', 'survey')),
  content_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, content_type, content_id)
);

alter table public.likes enable row level security;

create policy "likes_select_all"
  on public.likes for select
  using (true);

create policy "likes_insert_own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content_type text not null check (content_type in ('ad', 'remix', 'survey')),
  content_id uuid not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "comments_select_all"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Reviews table (for products)
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ad_id uuid references public.ads(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reviews enable row level security;

create policy "reviews_select_all"
  on public.reviews for select
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists ads_user_id_idx on public.ads(user_id);
create index if not exists ads_created_at_idx on public.ads(created_at desc);
create index if not exists surveys_user_id_idx on public.surveys(user_id);
create index if not exists surveys_created_at_idx on public.surveys(created_at desc);
create index if not exists remixes_user_id_idx on public.remixes(user_id);
create index if not exists remixes_ad_id_idx on public.remixes(ad_id);
create index if not exists remixes_created_at_idx on public.remixes(created_at desc);
create index if not exists likes_user_id_idx on public.likes(user_id);
create index if not exists likes_content_idx on public.likes(content_type, content_id);
create index if not exists comments_user_id_idx on public.comments(user_id);
create index if not exists comments_content_idx on public.comments(content_type, content_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_ad_id_idx on public.reviews(ad_id);
