insert into storage.buckets (id, name, public) 
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

-- Policy to allow anyone to read the images
create policy "Menu images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'menu-images' );
