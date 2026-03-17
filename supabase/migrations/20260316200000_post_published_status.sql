-- Add 'Published' to the post_status enum and publishing metadata columns

alter type post_status add value if not exists 'Published';

alter table public.posts
  add column if not exists published_url  text,
  add column if not exists published_at   timestamptz;
