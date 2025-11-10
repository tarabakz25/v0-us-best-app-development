-- Aggregated survey results helper
create or replace function public.get_survey_results(p_survey_id uuid)
returns table(
  question text,
  option text,
  vote_count bigint,
  total_votes bigint
)
security definer
set search_path = public
language sql
as $$
  with answer_rows as (
    select
      sr.survey_id,
      answer ->> 'question' as question,
      answer ->> 'answer' as option
    from public.survey_responses sr
    cross join lateral jsonb_array_elements(sr.answers) as answer
    where sr.survey_id = p_survey_id
  ), totals as (
    select count(*) as total_votes
    from public.survey_responses
    where survey_id = p_survey_id
  )
  select
    ar.question,
    ar.option,
    count(*) as vote_count,
    coalesce(t.total_votes, 0) as total_votes
  from answer_rows ar
  cross join totals t
  group by ar.question, ar.option, t.total_votes
  order by ar.question, vote_count desc;
$$;

grant execute on function public.get_survey_results to authenticated, anon;
