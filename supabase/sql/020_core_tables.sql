-- 020_core_tables.sql
-- Main app tables.

-- Positions (seed data)
create table if not exists public.positions (
  code text primary key,
  name text not null
);

insert into public.positions(code, name)
values
  ('QB','Quarterback'),('RB','Running Back'),('FB','Fullback'),('WR','Wide Receiver'),('TE','Tight End'),
  ('OL','Offensive Line'),('DL','Defensive Line'),('LB','Linebacker'),('CB','Cornerback'),('S','Safety'),
  ('K','Kicker'),('P','Punter'),('LS','Long Snapper')
on conflict (code) do nothing;

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  mascot text,
  season_year int,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team members (who can see/manage the team)
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.team_member_role not null default 'player',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- Players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  jersey_number int,
  position_code text references public.positions(code),
  status public.player_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, jersey_number)
);

-- Staff (coaches, trainers, etc.)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Opponents (shared across a user's teams)
create table if not exists public.opponents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  mascot text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, name)
);

-- Games
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  opponent_id uuid references public.opponents(id) on delete set null,
  start_time timestamptz not null,
  location text,
  home_away public.home_away not null default 'home',
  game_type public.game_type not null default 'regular',
  status public.event_status not null default 'scheduled',
  team_score int,
  opponent_score int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Practices
create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  focus text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple per-player per-game stats (extend with your own JSON shape)
create table if not exists public.player_game_stats (
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  stats jsonb not null default '{}'::jsonb,
  snaps int,
  primary key (game_id, player_id)
);

-- updated_at triggers for tables with updated_at
drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at before update on public.teams for each row execute function public.set_updated_at();

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at before update on public.players for each row execute function public.set_updated_at();

drop trigger if exists set_staff_updated_at on public.staff;
create trigger set_staff_updated_at before update on public.staff for each row execute function public.set_updated_at();

drop trigger if exists set_opponents_updated_at on public.opponents;
create trigger set_opponents_updated_at before update on public.opponents for each row execute function public.set_updated_at();

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at before update on public.games for each row execute function public.set_updated_at();

drop trigger if exists set_practices_updated_at on public.practices;
create trigger set_practices_updated_at before update on public.practices for each row execute function public.set_updated_at();

