-- Archived plans: workouts from a previous plan version stay in the database (sessions reference them)
-- but are hidden from Lucas's Today screen and the week. The coach can still view them under Plan.
alter table workouts add column if not exists archived boolean not null default false;
alter table workouts add column if not exists archive_note text not null default '';
