alter table public.texts
  add column if not exists alternate_titles text[],
  add column if not exists author_attribution text,
  add column if not exists language_label text,
  add column if not exists script_label text,
  add column if not exists region_label text,
  add column if not exists school_lineage text,
  add column if not exists text_type text,
  add column if not exists related_text_slugs text[],
  add column if not exists research_notes text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists texts_tradition_idx on public.texts(tradition);
create index if not exists texts_slug_idx on public.texts(slug);

create table if not exists public.text_source_links (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references public.texts(id) on delete cascade,
  source_submission_id uuid not null references public.source_submissions(id) on delete cascade,
  relationship text not null default 'primary',
  ordinal integer not null default 0,
  created_at timestamptz not null default now(),
  unique(text_id, source_submission_id)
);

create index if not exists text_source_links_text_idx on public.text_source_links(text_id, ordinal);
create index if not exists text_source_links_source_idx on public.text_source_links(source_submission_id);

alter table public.text_source_links enable row level security;
drop policy if exists "admins manage text source links" on public.text_source_links;
create policy "admins manage text source links"
on public.text_source_links for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_text_research_record(p_slug text)
returns table(
  id uuid, slug text, title text, alternate_titles text[], tradition text, period_label text,
  author_attribution text, language_label text, script_label text, region_label text,
  school_lineage text, text_type text, description text, evidence_note text,
  research_notes text, related_text_slugs text[], updated_at timestamptz
)
language sql security invoker stable
as $$
  select t.id,t.slug,t.title,t.alternate_titles,t.tradition,t.period_label,t.author_attribution,
         t.language_label,t.script_label,t.region_label,t.school_lineage,t.text_type,
         t.description,t.evidence_note,t.research_notes,t.related_text_slugs,t.updated_at
  from public.texts t where t.slug=p_slug limit 1;
$$;

create or replace function public.get_public_text_sources(p_text_id uuid)
returns table(
  source_id uuid, title text, author text, source_type text, url text,
  rights_status text, relationship text, ordinal integer
)
language sql security definer stable set search_path=public
as $$
  select s.id,s.title,s.author,s.source_type,s.url,s.rights_status,l.relationship,l.ordinal
  from public.text_source_links l
  join public.source_submissions s on s.id=l.source_submission_id
  where l.text_id=p_text_id and s.review_status='approved'
    and s.rights_status in ('public_domain','licensed')
  order by l.ordinal,s.title;
$$;

grant execute on function public.get_public_text_sources(uuid) to anon,authenticated;
grant execute on function public.get_text_research_record(text) to anon,authenticated;
