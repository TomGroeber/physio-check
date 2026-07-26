-- ============================================================
-- Sichere Nachrichtenfunktion zwischen Patient:in und der aktuell
-- verbundenen Praxis (nur Text, siehe docs/PRODUCT_SPEC.md).
--
-- Tenant-Modell: eine conversation ist fix einer Praxis und einer
-- Patientin/einem Patienten zugeordnet (unique je Paar). Lesen bleibt
-- für beide Seiten als Historie erhalten, SCHREIBEN ist jedoch nur
-- erlaubt, solange die Verbindung aktuell aktiv ist. Anders als beim
-- completion_logs-Muster (Praxis behält Lesezugriff auf eigene
-- Historie unabhängig vom Link-Status) verlangt der Auftrag hier
-- ausdrücklich: "muss nie Unterhaltungen fremder/ehemaliger Praxen
-- sehen" - die Praxis verliert also nach einem Praxiswechsel auch das
-- Leserecht, während die Patientin ihre eigene Historie über
-- patient_profile_id = auth.uid() weiterhin sieht (kein Link-Status
-- nötig, wie bei appointments/completion_logs auf Patientenseite).
--
-- Absenderrolle/-ID werden nie vom Client übernommen: alle Schreib-
-- zugriffe laufen über SECURITY DEFINER RPCs, die practice_id/
-- patient_profile_id ausschließlich aus der Sitzung bzw. der
-- vorhandenen conversation-Zeile herleiten.
-- ============================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  patient_last_read_at timestamptz,
  practice_last_read_at timestamptz,
  unique (practice_id, patient_profile_id)
);

create index conversations_practice_idx on public.conversations (practice_id, last_message_at desc);
create index conversations_patient_idx on public.conversations (patient_profile_id);

comment on table public.conversations is
  'Eine Unterhaltung je (Praxis, Patient:in)-Paar. Wird über die send_*-RPCs angelegt, nie direkt vom Client.';

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('patient', 'practice')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

comment on table public.messages is
  'Unveränderlich nach dem Senden: kein Update-/Delete-Recht für Clients, kein direktes Insert (nur über send_*-RPCs).';

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Prüft, ob eine bestimmte Patientin/ein bestimmter Patient AKTUELL
-- (nicht historisch) mit der genannten Praxis verbunden ist. Analog zu
-- is_linked_patient(), aber für eine beliebige Patient-ID (Praxissicht),
-- nicht nur für auth.uid() (Patientensicht).
create function public.patient_currently_linked_to_practice(
  p_patient_profile_id uuid,
  p_practice_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.patient_practice_links l
    where l.patient_profile_id = p_patient_profile_id
      and l.practice_id = p_practice_id
      and l.status = 'active'
  );
$$;

revoke all on function public.patient_currently_linked_to_practice(uuid, uuid) from public, anon;
grant execute on function public.patient_currently_linked_to_practice(uuid, uuid) to authenticated;

-- ---------- conversations: RLS ----------

create policy "conversations: patient reads own"
  on public.conversations for select
  using (patient_profile_id = (select auth.uid()));

create policy "conversations: practice reads while currently linked"
  on public.conversations for select
  using (
    public.is_practice_member(practice_id)
    and public.patient_currently_linked_to_practice(patient_profile_id, practice_id)
  );

revoke all on public.conversations from authenticated, anon;
grant select on public.conversations to authenticated;

-- ---------- messages: RLS ----------

create policy "messages: visible via accessible conversation"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.patient_profile_id = (select auth.uid())
          or (
            public.is_practice_member(c.practice_id)
            and public.patient_currently_linked_to_practice(c.patient_profile_id, c.practice_id)
          )
        )
    )
  );

revoke all on public.messages from authenticated, anon;
grant select on public.messages to authenticated;

-- ---------- send_patient_message ----------
-- Keine Praxis-ID vom Client: die Zielpraxis wird ausschließlich aus
-- der eigenen aktiven patient_practice_links-Zeile hergeleitet, damit
-- eine Nachricht nie an eine andere als die aktuell verbundene Praxis
-- gehen kann. Legt die conversation bei Bedarf an (get-or-create).
create function public.send_patient_message(p_body text)
returns table (out_conversation_id uuid, out_message_id uuid, out_created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_practice_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_created_at timestamptz;
  v_recent_count int;
  v_body text := btrim(p_body);
begin
  if v_user_id is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'invalid_message' using errcode = 'P0001';
  end if;

  select l.practice_id into v_practice_id
  from public.patient_practice_links l
  where l.patient_profile_id = v_user_id and l.status = 'active'
  limit 1;

  if v_practice_id is null then
    raise exception 'no_active_practice_link' using errcode = 'P0001';
  end if;

  -- Rate-Limit gegen Spam/versehentliches Mehrfachsenden: max. 20
  -- Nachrichten pro Minute je Absender:in und Unterhaltung.
  select count(*) into v_recent_count
  from public.messages m
  where m.conversation_id in (
    select id from public.conversations
    where practice_id = v_practice_id and patient_profile_id = v_user_id
  )
  and m.sender_profile_id = v_user_id
  and m.created_at > now() - interval '1 minute';
  if v_recent_count >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.conversations (practice_id, patient_profile_id)
  values (v_practice_id, v_user_id)
  on conflict (practice_id, patient_profile_id) do update
    set practice_id = excluded.practice_id
  returning id into v_conversation_id;

  update public.conversations
  set last_message_at = now(), patient_last_read_at = now()
  where id = v_conversation_id;

  insert into public.messages (conversation_id, sender_profile_id, sender_role, body)
  values (v_conversation_id, v_user_id, 'patient', v_body)
  returning id, created_at into v_message_id, v_created_at;

  -- Praxis informieren (Bestandssystem, datensparsam: kein
  -- Nachrichtentext). Alle aktiven Mitglieder, da jede:r antworten
  -- darf.
  insert into public.notifications (recipient_profile_id, type, title, body, reference)
  select pm.profile_id, 'new_patient_message', 'Neue Nachricht',
    coalesce(nullif(btrim(p.full_name), ''), 'Eine Patientin/ein Patient')
      || ' hat Ihnen eine Nachricht geschrieben.',
    jsonb_build_object('conversationId', v_conversation_id)
  from public.practice_members pm
  join public.profiles p on p.id = v_user_id
  where pm.practice_id = v_practice_id and pm.is_active;

  return query select v_conversation_id, v_message_id, v_created_at;
end;
$$;

revoke all on function public.send_patient_message(text) from public, anon;
grant execute on function public.send_patient_message(text) to authenticated;

-- ---------- send_practice_reply ----------
-- Praxismitglied antwortet in einer bestehenden Unterhaltung. Erlaubt
-- nur, solange die Patientin/der Patient aktuell noch mit dieser
-- Praxis verbunden ist ("ehemalige Praxis verliert Schreibrecht").
create function public.send_practice_reply(p_conversation_id uuid, p_body text)
returns table (out_message_id uuid, out_created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_practice_id uuid;
  v_patient_id uuid;
  v_message_id uuid;
  v_created_at timestamptz;
  v_recent_count int;
  v_body text := btrim(p_body);
begin
  if v_user_id is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'invalid_message' using errcode = 'P0001';
  end if;

  select c.practice_id, c.patient_profile_id into v_practice_id, v_patient_id
  from public.conversations c
  where c.id = p_conversation_id;

  if v_practice_id is null then
    raise exception 'conversation_not_found' using errcode = 'P0001';
  end if;
  if not public.is_practice_member(v_practice_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if not public.patient_currently_linked_to_practice(v_patient_id, v_practice_id) then
    raise exception 'patient_not_currently_linked' using errcode = 'P0001';
  end if;

  select count(*) into v_recent_count
  from public.messages m
  where m.conversation_id = p_conversation_id
    and m.sender_profile_id = v_user_id
    and m.created_at > now() - interval '1 minute';
  if v_recent_count >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  update public.conversations
  set last_message_at = now(), practice_last_read_at = now()
  where id = p_conversation_id;

  insert into public.messages (conversation_id, sender_profile_id, sender_role, body)
  values (p_conversation_id, v_user_id, 'practice', v_body)
  returning id, created_at into v_message_id, v_created_at;

  insert into public.notifications (recipient_profile_id, type, title, body, reference)
  values (
    v_patient_id, 'new_practice_reply', 'Neue Antwort',
    'Ihre Praxis hat Ihnen geantwortet.',
    jsonb_build_object('conversationId', p_conversation_id)
  );

  return query select v_message_id, v_created_at;
end;
$$;

revoke all on function public.send_practice_reply(uuid, text) from public, anon;
grant execute on function public.send_practice_reply(uuid, text) to authenticated;

-- ---------- mark_conversation_read_as_patient ----------
create function public.mark_conversation_read_as_patient()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  update public.conversations
  set patient_last_read_at = now()
  where patient_profile_id = v_user_id;
end;
$$;

revoke all on function public.mark_conversation_read_as_patient() from public, anon;
grant execute on function public.mark_conversation_read_as_patient() to authenticated;

-- ---------- mark_conversation_read_as_practice ----------
create function public.mark_conversation_read_as_practice(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_practice_id uuid;
  v_patient_id uuid;
begin
  select c.practice_id, c.patient_profile_id into v_practice_id, v_patient_id
  from public.conversations c
  where c.id = p_conversation_id;

  if v_practice_id is null then
    raise exception 'conversation_not_found' using errcode = 'P0001';
  end if;
  if not public.is_practice_member(v_practice_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if not public.patient_currently_linked_to_practice(v_patient_id, v_practice_id) then
    raise exception 'patient_not_currently_linked' using errcode = 'P0001';
  end if;

  update public.conversations
  set practice_last_read_at = now()
  where id = p_conversation_id;
end;
$$;

revoke all on function public.mark_conversation_read_as_practice(uuid) from public, anon;
grant execute on function public.mark_conversation_read_as_practice(uuid) to authenticated;
