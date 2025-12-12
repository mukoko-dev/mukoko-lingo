-- Create phrases table to store all language phrases
create table if not exists public.phrases (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  
  -- English
  english text not null,
  english_pronunciation text not null,
  english_context text not null,
  
  -- Shona
  shona text not null,
  shona_pronunciation text not null,
  shona_context text not null,
  
  -- Ndebele
  ndebele text not null,
  ndebele_pronunciation text not null,
  ndebele_context text not null,
  
  -- Chinese
  chinese text not null,
  chinese_pronunciation text not null,
  chinese_context text not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (for future user-contributed content)
alter table public.phrases enable row level security;

-- Allow anyone to read phrases (public content)
create policy "phrases_select_all"
  on public.phrases for select
  using (true);

-- Create index for faster category queries
create index if not exists idx_phrases_category on public.phrases(category);
