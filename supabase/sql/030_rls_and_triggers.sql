-- 030_rls_and_triggers.sql
-- Row Level Security (RLS), helper functions, and insert triggers.

-- Helper: is the current user a member of a team?
create or replace function public.is_team_member(tid uuid)
returns boolean
language plpgsql
stable
set search_path = public
as $$
begin
  return exists(
    select 1 from public.team_members
    where public.team_members.team_id = tid
      and public.team_members.user_id = auth.uid()
      and public.team_members.is_active = true
  );
end;
$$;

-- Helper: does the current user have one of the allowed roles on a team?
create or replace function public.has_team_role(tid uuid, allowed public.team_member_role[])
returns boolean
language plpgsql
stable
set search_path = public
as $$
begin
  return exists(
    select 1 from public.team_members
    where public.team_members.team_id = tid
      and public.team_members.user_id = auth.uid()
      and public.team_members.is_active = true
      and public.team_members.role = any(allowed)
  );
end;
$$;

-- Automatically set created_by on insert for teams and opponents
create or replace function public.set_created_by()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;


drop trigger if exists teams_set_created_by on public.teams;
create trigger teams_set_created_by
before insert on public.teams
for each row execute function public.set_created_by();

drop trigger if exists opponents_set_created_by on public.opponents;
create trigger opponents_set_created_by
before insert on public.opponents
for each row execute function public.set_created_by();

-- When a team is created, add the creator as an owner member.
create or replace function public.add_team_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members(team_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (team_id, user_id) do update set role = excluded.role, is_active = true;
  return new;
end;
$$;

drop trigger if exists teams_add_owner_member on public.teams;
create trigger teams_add_owner_member
after insert on public.teams
for each row execute function public.add_team_owner_member();

-- Enable RLS
alter table public.positions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.staff enable row level security;
alter table public.opponents enable row level security;
alter table public.games enable row level security;
alter table public.practices enable row level security;
alter table public.player_game_stats enable row level security;

-- POSITIONS: readable by anyone
drop policy if exists positions_select_all on public.positions;
create policy positions_select_all
  on public.positions
  for select
  to anon, authenticated
  using (true);

-- TEAMS
drop policy if exists teams_select_member on public.teams;
create policy teams_select_member
  on public.teams
  for select
  to authenticated
  using (public.is_team_member(id));

drop policy if exists teams_insert_authenticated on public.teams;
create policy teams_insert_authenticated
  on public.teams
  for insert
  to authenticated
  with check (true); -- Allow any authenticated user to create teams, trigger will set created_by

drop policy if exists teams_update_owner_or_coach on public.teams;
create policy teams_update_owner_or_coach
  on public.teams
  for update
  to authenticated
  using (public.has_team_role(id, array['owner','coach']::public.team_member_role[]))
  with check (public.has_team_role(id, array['owner','coach']::public.team_member_role[]));

drop policy if exists teams_delete_owner on public.teams;
create policy teams_delete_owner
  on public.teams
  for delete
  to authenticated
  using (public.has_team_role(id, array['owner']::public.team_member_role[]));

-- TEAM_MEMBERS
drop policy if exists team_members_select_member on public.team_members;
create policy team_members_select_member
  on public.team_members
  for select
  to authenticated
  using (public.is_team_member(team_id));

drop policy if exists team_members_mutate_owner_or_coach on public.team_members;
create policy team_members_mutate_owner_or_coach
  on public.team_members
  for all
  to authenticated
  using (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]))
  with check (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]));

-- PLAYERS
drop policy if exists players_select_member on public.players;
create policy players_select_member
  on public.players
  for select
  to authenticated
  using (public.is_team_member(team_id));

drop policy if exists players_mutate_owner_or_coach on public.players;
create policy players_mutate_owner_or_coach
  on public.players
  for all
  to authenticated
  using (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]))
  with check (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]));

-- STAFF
drop policy if exists staff_select_member on public.staff;
create policy staff_select_member
  on public.staff
  for select
  to authenticated
  using (public.is_team_member(team_id));

drop policy if exists staff_mutate_owner_or_coach on public.staff;
create policy staff_mutate_owner_or_coach
  on public.staff
  for all
  to authenticated
  using (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]))
  with check (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]));

-- OPPONENTS (owned by user)
drop policy if exists opponents_select_own on public.opponents;
create policy opponents_select_own
  on public.opponents
  for select
  to authenticated
  using (created_by = auth.uid());

drop policy if exists opponents_mutate_own on public.opponents;
create policy opponents_mutate_own
  on public.opponents
  for all
  to authenticated
  using (created_by = auth.uid())
  with check (created_by is null or created_by = auth.uid());

-- GAMES
drop policy if exists games_select_member on public.games;
create policy games_select_member
  on public.games
  for select
  to authenticated
  using (public.is_team_member(team_id));

drop policy if exists games_mutate_owner_or_coach on public.games;
create policy games_mutate_owner_or_coach
  on public.games
  for all
  to authenticated
  using (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]))
  with check (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]));

-- PRACTICES
drop policy if exists practices_select_member on public.practices;
create policy practices_select_member
  on public.practices
  for select
  to authenticated
  using (public.is_team_member(team_id));

drop policy if exists practices_mutate_owner_or_coach on public.practices;
create policy practices_mutate_owner_or_coach
  on public.practices
  for all
  to authenticated
  using (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]))
  with check (public.has_team_role(team_id, array['owner','coach']::public.team_member_role[]));

-- PLAYER_GAME_STATS
-- We don't store team_id here; enforce access by joining through games.
drop policy if exists pgs_select_member on public.player_game_stats;
create policy pgs_select_member
  on public.player_game_stats
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.games
      where public.games.id = public.player_game_stats.game_id
        and public.is_team_member(public.games.team_id)
    )
  );

drop policy if exists pgs_mutate_owner_or_coach on public.player_game_stats;
create policy pgs_mutate_owner_or_coach
  on public.player_game_stats
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.games
      where public.games.id = public.player_game_stats.game_id
        and public.has_team_role(public.games.team_id, array['owner','coach']::public.team_member_role[])
    )
  )
  with check (
    exists (
      select 1
      from public.games
      where public.games.id = public.player_game_stats.game_id
        and public.has_team_role(public.games.team_id, array['owner','coach']::public.team_member_role[])
    )
  );
