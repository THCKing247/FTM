-- 002_types.sql
-- Enums used by the app.

DO $$ BEGIN
  create type public.team_member_role as enum ('owner','coach','player','staff','viewer');
EXCEPTION
  when duplicate_object then null;
END $$;

DO $$ BEGIN
  create type public.player_status as enum ('active','injured','inactive');
EXCEPTION
  when duplicate_object then null;
END $$;

DO $$ BEGIN
  create type public.game_type as enum ('regular','scrimmage','playoff');
EXCEPTION
  when duplicate_object then null;
END $$;

DO $$ BEGIN
  create type public.home_away as enum ('home','away');
EXCEPTION
  when duplicate_object then null;
END $$;

DO $$ BEGIN
  create type public.event_status as enum ('scheduled','completed','canceled');
EXCEPTION
  when duplicate_object then null;
END $$;

