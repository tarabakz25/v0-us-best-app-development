-- Survey responses table
create table if not exists public.survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (survey_id, user_id)
);

alter table public.survey_responses enable row level security;

create policy "survey_responses_select_own"
  on public.survey_responses for select
  using (auth.uid() = user_id);

create policy "survey_responses_insert_own"
  on public.survey_responses for insert
  with check (auth.uid() = user_id);

create policy "survey_responses_update_own"
  on public.survey_responses for update
  using (auth.uid() = user_id);

create policy "survey_responses_delete_own"
  on public.survey_responses for delete
  using (auth.uid() = user_id);

create index if not exists survey_responses_user_idx on public.survey_responses(user_id);
create index if not exists survey_responses_survey_idx on public.survey_responses(survey_id);
