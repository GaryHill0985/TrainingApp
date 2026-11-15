-- Equipment busy: each exercise lists suitable replacements (same muscle group); a session's exercise log
-- records when Lucas swapped the planned exercise for one of them (sets are then logged under the replacement).
alter table exercises add column if not exists alternatives text[] not null default '{}';
alter table exercise_logs add column if not exists swapped_to text;
