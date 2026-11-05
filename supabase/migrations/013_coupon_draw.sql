-- 관리자 전용 랜덤 행사 쿠폰 추첨
-- 추첨(무작위 선택)과 쿠폰 번호 생성은 DB에서 한다 → 화면 조작으로 결과를 바꿀 수 없고 기록이 남는다.

create table public.coupon_events (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 60),
  coupon text not null check (char_length(coupon) between 1 and 100),
  candidate_count int not null,
  winner_count int not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.coupon_winners (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.coupon_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  messaged boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.coupon_events enable row level security;
alter table public.coupon_winners enable row level security;

create policy coupon_events_read on public.coupon_events for select to authenticated using (public.is_admin());
-- 당첨자는 자기 쿠폰을 볼 수 있음
create policy coupon_winners_read on public.coupon_winners for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.coupon_events, public.coupon_winners from anon;
revoke insert, update, delete on public.coupon_events, public.coupon_winners from authenticated;

-- 추첨: 후보(candidates) 중 관리자를 뺀 실제 회원에서 n명을 무작위로 뽑고 쿠폰 번호 발급
create function public.admin_draw_coupons(title text, coupon text, candidates uuid[], n int) returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare eid bigint; pool int;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  select count(*) into pool from public.profiles p where p.id = any(candidates) and not p.is_admin;
  if pool = 0 then raise exception 'no candidates'; end if;
  if n < 1 or n > pool then raise exception 'invalid winner count'; end if;

  insert into public.coupon_events (title, coupon, candidate_count, winner_count, created_by)
  values (btrim(title), btrim(coupon), pool, n, auth.uid())
  returning id into eid;

  insert into public.coupon_winners (event_id, user_id, code)
  select eid, p.id,
         'BOYUK-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 4)) || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 4))
  from public.profiles p
  where p.id = any(candidates) and not p.is_admin
  order by random()
  limit n;
  return eid;
end $$;

-- 당첨자 전원에게 1:1 메시지 발송 ({닉네임}, {쿠폰번호}, {쿠폰} 자리를 바꿔 넣음). 이미 보낸 사람은 건너뜀.
create function public.admin_message_winners(eid bigint, msg_title text, msg_body text) returns int
language plpgsql security definer set search_path = public as $$
declare w record; sent int := 0; ev record;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  select * into ev from public.coupon_events where id = eid;
  if not found then raise exception 'event not found'; end if;
  for w in
    select cw.id, cw.user_id, cw.code, p.nickname
    from public.coupon_winners cw join public.profiles p on p.id = cw.user_id
    where cw.event_id = eid and not cw.messaged
  loop
    perform public.admin_start_inquiry(
      w.user_id,
      msg_title,
      replace(replace(replace(msg_body, '{닉네임}', w.nickname), '{쿠폰번호}', w.code), '{쿠폰}', ev.coupon)
    );
    update public.coupon_winners set messaged = true where id = w.id;
    sent := sent + 1;
  end loop;
  return sent;
end $$;

revoke execute on function public.admin_draw_coupons(text, text, uuid[], int), public.admin_message_winners(bigint, text, text) from public, anon;
grant execute on function public.admin_draw_coupons(text, text, uuid[], int), public.admin_message_winners(bigint, text, text) to authenticated;
