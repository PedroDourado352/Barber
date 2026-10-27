-- ============================================================
-- Barberly — Agendamento online (página pública do cliente)
-- ADITIVO: não apaga nada. Pode rodar de novo com segurança.
-- Rode DEPOIS do schema.sql. Supabase > SQL Editor > cole TUDO > Run.
-- ============================================================

-- 1) Origem do agendamento (admin x site do cliente)
alter table public.appointments add column if not exists source text not null default 'admin';

-- 2) "Loja" (uma por conta): link público, whatsapp e horários
create table if not exists public.shops (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  slug text unique not null,
  business_name text default '',
  whatsapp text default '',
  address text default '',
  slot_minutes int not null default 30,
  hours jsonb not null default '{
    "0": null,
    "1": {"open":"09:00","close":"19:00"},
    "2": {"open":"09:00","close":"19:00"},
    "3": {"open":"09:00","close":"19:00"},
    "4": {"open":"09:00","close":"19:00"},
    "5": {"open":"09:00","close":"19:00"},
    "6": {"open":"09:00","close":"14:00"}
  }'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;
drop policy if exists "owner_all" on public.shops;
create policy "owner_all" on public.shops for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 3) Funções públicas (chamadas pelo cliente sem login). SECURITY DEFINER:
--    rodam com permissão elevada mas só fazem a operação segura, por slug.

-- 3a) Dados para montar a página
create or replace function public.get_booking_info(p_slug text)
returns jsonb language sql security definer set search_path = public as $$
  select case when s.owner_id is null then null else jsonb_build_object(
    'business_name', s.business_name,
    'whatsapp', s.whatsapp,
    'address', s.address,
    'slot_minutes', s.slot_minutes,
    'hours', s.hours,
    'services', coalesce((
      select jsonb_agg(jsonb_build_object('id', sv.id, 'name', sv.name, 'price', sv.price, 'duration_min', sv.duration_min) order by sv.name)
      from services sv where sv.owner_id = s.owner_id and sv.active), '[]'::jsonb),
    'barbers', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name) order by b.name)
      from barbers b where b.owner_id = s.owner_id and b.active), '[]'::jsonb)
  ) end
  from public.shops s where s.slug = p_slug;
$$;

-- 3b) Horários livres. p_barber_id = NULL significa "qualquer profissional".
create or replace function public.get_available_times(
  p_slug text, p_barber_id bigint, p_service_id bigint, p_date date
) returns text[] language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_hours jsonb; v_slot int; v_dur int;
  v_dow int; v_day jsonb; v_open int; v_close int;
  v_active int; t int; busy int; result text[] := '{}';
begin
  select owner_id, hours, slot_minutes into v_owner, v_hours, v_slot
    from public.shops where slug = p_slug;
  if v_owner is null then return result; end if;

  select duration_min into v_dur from public.services
    where id = p_service_id and owner_id = v_owner;
  if v_dur is null then return result; end if;

  v_dow := extract(dow from p_date)::int;
  v_day := v_hours -> v_dow::text;
  if v_day is null or jsonb_typeof(v_day) = 'null' then return result; end if;

  v_open  := split_part(v_day->>'open', ':', 1)::int * 60 + split_part(v_day->>'open', ':', 2)::int;
  v_close := split_part(v_day->>'close',':', 1)::int * 60 + split_part(v_day->>'close',':', 2)::int;

  select count(*) into v_active from public.barbers where owner_id = v_owner and active;
  if v_active = 0 then v_active := 1; end if;

  t := v_open;
  while t + v_dur <= v_close loop
    if p_barber_id is null then
      -- livre se pelo menos um barbeiro estiver livre nesse horário
      select count(distinct a.barber_id) into busy
        from public.appointments a
        where a.owner_id = v_owner and a.date = p_date and a.status <> 'cancelado'
          and a.barber_id is not null
          and split_part(a.time, ':', 1)::int * 60 + split_part(a.time, ':', 2)::int < t + v_dur
          and t < split_part(a.time, ':', 1)::int * 60 + split_part(a.time, ':', 2)::int + coalesce(a.duration_min, 30);
      if busy < v_active then
        result := array_append(result, lpad((t/60)::text, 2, '0') || ':' || lpad((t%60)::text, 2, '0'));
      end if;
    else
      select count(*) into busy
        from public.appointments a
        where a.owner_id = v_owner and a.barber_id = p_barber_id and a.date = p_date and a.status <> 'cancelado'
          and split_part(a.time, ':', 1)::int * 60 + split_part(a.time, ':', 2)::int < t + v_dur
          and t < split_part(a.time, ':', 1)::int * 60 + split_part(a.time, ':', 2)::int + coalesce(a.duration_min, 30);
      if busy = 0 then
        result := array_append(result, lpad((t/60)::text, 2, '0') || ':' || lpad((t%60)::text, 2, '0'));
      end if;
    end if;
    t := t + v_slot;
  end loop;
  return result;
end;
$$;

-- 3c) Cria o agendamento (e o cliente, se necessário). p_barber_id NULL = escolhe um livre.
create or replace function public.book_appointment(
  p_slug text, p_client_name text, p_client_phone text,
  p_barber_id bigint, p_service_id bigint, p_date date, p_time text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_dur int; v_price numeric; v_sname text;
  v_client bigint; v_appt bigint; v_free text[]; v_barber bigint; v_tmin int;
begin
  select owner_id into v_owner from public.shops where slug = p_slug;
  if v_owner is null then return jsonb_build_object('ok', false, 'error', 'Barbearia não encontrada.'); end if;
  if coalesce(btrim(p_client_name), '') = '' then return jsonb_build_object('ok', false, 'error', 'Informe seu nome.'); end if;

  select duration_min, price, name into v_dur, v_price, v_sname
    from public.services where id = p_service_id and owner_id = v_owner and active;
  if v_dur is null then return jsonb_build_object('ok', false, 'error', 'Serviço indisponível.'); end if;

  v_free := public.get_available_times(p_slug, p_barber_id, p_service_id, p_date);
  if not (p_time = any(v_free)) then
    return jsonb_build_object('ok', false, 'error', 'Esse horário não está mais disponível.');
  end if;

  v_barber := p_barber_id;
  if v_barber is null then
    -- escolhe o primeiro barbeiro ativo livre nesse horário
    v_tmin := split_part(p_time, ':', 1)::int * 60 + split_part(p_time, ':', 2)::int;
    select b.id into v_barber from public.barbers b
      where b.owner_id = v_owner and b.active
        and not exists (
          select 1 from public.appointments a
          where a.owner_id = v_owner and a.barber_id = b.id and a.date = p_date and a.status <> 'cancelado'
            and split_part(a.time, ':', 1)::int * 60 + split_part(a.time, ':', 2)::int < v_tmin + v_dur
            and v_tmin < split_part(a.time, ':', 1)::int * 60 + split_part(a.time, ':', 2)::int + coalesce(a.duration_min, 30)
        )
      order by b.id limit 1;
  end if;

  if coalesce(btrim(p_client_phone), '') <> '' then
    select id into v_client from public.clients
      where owner_id = v_owner and phone = btrim(p_client_phone) limit 1;
  end if;
  if v_client is null then
    insert into public.clients (owner_id, name, phone)
      values (v_owner, btrim(p_client_name), coalesce(btrim(p_client_phone), ''))
      returning id into v_client;
  end if;

  insert into public.appointments
    (owner_id, client_id, client_name, service_id, service_name, duration_min, barber_id, date, time, price, status, source, note)
  values
    (v_owner, v_client, btrim(p_client_name), p_service_id, v_sname, v_dur, v_barber, p_date, p_time, v_price, 'aguardando', 'online', 'Agendado pelo cliente')
  returning id into v_appt;

  return jsonb_build_object('ok', true, 'appointment_id', v_appt);
end;
$$;

grant execute on function public.get_booking_info(text) to anon, authenticated;
grant execute on function public.get_available_times(text, bigint, bigint, date) to anon, authenticated;
grant execute on function public.book_appointment(text, text, text, bigint, bigint, date, text) to anon, authenticated;
