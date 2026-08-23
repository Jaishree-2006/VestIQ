-- Supabase schema for user profiles and CAS upload audit

create table if not exists profiles (
  id uuid primary key references auth.users(id),
  full_name text not null,
  pan text,
  email text,
  created_at timestamp with time zone default now()
);

create or replace function insert_profile_from_auth_user() returns trigger language plpgsql as $$
begin
  insert into profiles (id, full_name, pan, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email, ''),
    null,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger profile_after_user_insert
  after insert on auth.users
  for each row execute procedure insert_profile_from_auth_user();

create table if not exists cas_upload_audit (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  created_at timestamptz default now(),
  parsed_name text,
  profile_name text,
  similarity numeric,
  profile_pan text,
  parsed_pan text,
  outcome text,
  details jsonb
);
