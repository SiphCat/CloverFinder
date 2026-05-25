-- Optional leaf count on map finds (4–10). Run in Supabase → SQL Editor.
-- Lets the home map filter by clover type. Older finds stay visible under "All clovers".

alter table public.finds
  add column if not exists leaf_count int check (leaf_count is null or (leaf_count >= 4 and leaf_count <= 10));

create index if not exists finds_leaf_count_idx on public.finds (leaf_count)
  where leaf_count is not null;

notify pgrst, 'reload schema';
