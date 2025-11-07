-- Create storage bucket for media files
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Anyone can view media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Authenticated users can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media' 
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own media"
  on storage.objects for update
  using (
    bucket_id = 'media' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own media"
  on storage.objects for delete
  using (
    bucket_id = 'media' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
