-- ============================================================
-- Barberly — schema do banco (Supabase / Postgres)
-- IDs sequenciais (1, 2, 3...) por tabela.
--
-- Como usar: Supabase Dashboard > SQL Editor > New query >
--            cole TUDO > Run.
--
-- ATENÇÃO: este script APAGA as tabelas existentes e recria do zero
-- (os dados de teste serão perdidos). É o esperado ao trocar o tipo do ID.
-- ============================================================

create extension if not exists pgcrypto;

-- Remove as versões antigas (ordem por dependência; cascade cuida do resto).
drop table if exists public.transactions cascade;
drop table if exists public.appointments cascade;
drop table if exists public.clients cascade;
drop table if exists public.services cascade;
drop table if exists public.barbers cascade;

-- ---------- Tabelas ----------

create table public.services (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  duration_min int not null default 30,
  price numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.barbers (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  commission_rate numeric not null default 0.5,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table public.appointments (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id bigint references public.clients(id) on delete set null,
  client_name text default '',
  service_id bigint references public.services(id) on delete set null,
  service_name text default '',
  duration_min int default 30,
  barber_id bigint references public.barbers(id) on delete set null,
  date date not null,
  time text default '',
  price numeric not null default 0,
  status text not null default 'confirmado',
  note text default '',
  created_at timestamptz not null default now()
);

create table public.transactions (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null default 'entrada',
  source text not null default 'manual',
  appointment_id bigint references public.appointments(id) on delete set null,
  amount numeric not null default 0,
  method text default 'Dinheiro',
  barber_id bigint references public.barbers(id) on delete set null,
  description text default '',
  date date not null,
  created_at timestamptz not null default now()
);

-- ---------- Índices ----------

create index idx_services_owner on public.services(owner_id);
create index idx_barbers_owner on public.barbers(owner_id);
create index idx_clients_owner on public.clients(owner_id);
create index idx_appointments_owner_date on public.appointments(owner_id, date);
create index idx_transactions_owner_date on public.transactions(owner_id, date);

-- ---------- Segurança (RLS) ----------
-- Cada usuário só enxerga e altera os próprios dados.

alter table public.services     enable row level security;
alter table public.barbers      enable row level security;
alter table public.clients      enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['services','barbers','clients','appointments','transactions'] loop
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using (owner_id = auth.uid()) with check (owner_id = auth.uid());', t);
  end loop;
end $$;
