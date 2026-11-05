-- 1:1 문의: 회원 ↔ 관리자 대화
-- 회원은 자기 문의만, 관리자는 모든 문의를 볼 수 있다(RLS).

create table public.inquiries (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  admin_unread boolean not null default true,
  user_unread boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_user on public.inquiries (user_id, updated_at desc);
create index inquiries_updated on public.inquiries (updated_at desc);

create table public.inquiry_messages (
  id bigint generated always as identity primary key,
  inquiry_id bigint not null references public.inquiries(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index inquiry_messages_inquiry on public.inquiry_messages (inquiry_id, created_at);

alter table public.inquiries enable row level security;
alter table public.inquiry_messages enable row level security;

create function public.can_access_inquiry(iid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from public.inquiries where id = iid and user_id = auth.uid())
$$;

create policy inquiries_read on public.inquiries for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy inquiries_insert on public.inquiries for insert to authenticated
  with check (user_id = auth.uid());

create policy inquiry_messages_read on public.inquiry_messages for select to authenticated
  using (public.can_access_inquiry(inquiry_id));
-- 종료된 문의에는 메시지를 더 보낼 수 없다
create policy inquiry_messages_insert on public.inquiry_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_access_inquiry(inquiry_id)
    and exists (select 1 from public.inquiries where id = inquiry_id and status <> 'closed')
  );

-- 새 메시지가 오면 상태·읽음 표시 갱신
create function public.on_inquiry_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.inquiries where id = new.inquiry_id;
  if new.sender_id = owner then
    update public.inquiries set admin_unread = true, status = 'open', updated_at = now() where id = new.inquiry_id;
  else
    update public.inquiries set user_unread = true, status = 'answered', updated_at = now() where id = new.inquiry_id;
  end if;
  return new;
end $$;

create trigger inquiry_message_after_insert
after insert on public.inquiry_messages
for each row execute function public.on_inquiry_message();

-- 읽음 처리 (관리자는 관리자 쪽, 회원은 회원 쪽 표시만 끔)
create function public.mark_inquiry_read(iid bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    update public.inquiries set admin_unread = false where id = iid;
  else
    update public.inquiries set user_unread = false where id = iid and user_id = auth.uid();
  end if;
end $$;

-- 문의 종료 / 다시 열기 (관리자 또는 문의한 본인)
create function public.set_inquiry_closed(iid bigint, closed boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_inquiry(iid) then
    raise exception 'not allowed';
  end if;
  update public.inquiries set status = case when closed then 'closed' else 'open' end, updated_at = now() where id = iid;
end $$;

revoke all on public.inquiries, public.inquiry_messages from anon;
revoke update, delete on public.inquiries, public.inquiry_messages from authenticated;
revoke execute on function public.can_access_inquiry(bigint), public.mark_inquiry_read(bigint),
  public.set_inquiry_closed(bigint, boolean) from public, anon;
grant execute on function public.can_access_inquiry(bigint), public.mark_inquiry_read(bigint),
  public.set_inquiry_closed(bigint, boolean) to authenticated;
revoke execute on function public.on_inquiry_message() from public, anon, authenticated;
