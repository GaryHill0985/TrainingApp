import type { MetricInputType, PositionTag, TechniqueColour } from '../plan/types'

/** Local rows mirror the Postgres tables one-to-one so sync is a plain upsert. */

export interface SyncedRow {
  id: string
  user_id: string
  updated_at: string
  deleted: boolean
}

export interface SessionRow extends SyncedRow {
  workout_id: string
  date: string
  status: 'in_progress' | 'complete'
  started_at: string
  completed_at: string | null
  overall_note: string
}

export type ValueKind = 'reps' | 'seconds' | 'metres' | 'minutes'

export interface SetLogRow extends SyncedRow {
  session_id: string
  exercise_id: string
  set_number: number
  is_warmup: boolean
  weight: number | null
  reps_done: number | null
  value_kind: ValueKind
  side: 'left' | 'right' | null
  logged_at: string
}

export interface ExerciseLogRow extends SyncedRow {
  session_id: string
  exercise_id: string
  technique_colour: TechniqueColour | null
  pain_flag: boolean
  note: string
  back_extension_weight_flag: boolean
}

export interface MetricLogRow extends SyncedRow {
  date: string
  metric_key: string
  value_num: number | null
  value_text: string | null
  note: string
  logged_at: string
}

export interface ActivityEntryRow extends SyncedRow {
  date: string
  activity_type: string
  distance_value: number | null
  distance_unit: string | null
  duration_seconds: number | null
  note: string
  logged_at: string
}

export interface FoodEntryRow extends SyncedRow {
  date: string
  meal: string | null
  description: string
  calories: number | null
  time: string | null
  logged_at: string
}

export interface MilestoneProgressRow extends SyncedRow {
  milestone_key: string
  stage_index: number
  achieved_on: string
  note: string
}

// ---- plan tables (coach-editable) ----
export interface ExerciseRow {
  id: string
  name: string
  diagram_key: string
  position: PositionTag
  position_why: string
  trains: string
  find_equipment: string
  setup: string[]
  starting_position: string[]
  how_to_rep: string[]
  feel_do: string
  feel_dont: string
  common_mistakes: string[]
  stop_set_when: string[]
  easier_option: string
  progress_when: string
  video_search_query: string
  video_search_url: string
  video_url: string
  needs_photo: boolean
  photo_url: string
  ask_dad_before_loading: boolean
  mm_reference: string
  coach_edited_fields: string[]
  updated_at: string
}

export interface WorkoutRow {
  id: string
  name: string
  subtitle: string
  demand: string
  sort_order: number
  coach_edited_fields: string[]
  updated_at: string
}

export interface WorkoutItemRow {
  id: string
  workout_id: string
  order: number
  exercise_id: string
  sets: number
  rep_range: string
  rest: string
  effort_target: string
  warmup_sets: number
  position: PositionTag
  coach_edited: boolean
  deleted: boolean
  updated_at: string
}

export interface MuscleRow {
  id: string
  name: string
  region: string
  origin: string
  insertion: string
  action: string
  line_of_pull: string
  two_joint: boolean
  note: string
  coach_edited_fields: string[]
  updated_at: string
}

export interface ExerciseMuscleRow {
  exercise_id: string
  muscle_id: string
  role: 'prime' | 'synergist' | 'stabiliser'
  updated_at: string
}

export interface MetricDefinitionRow {
  key: string
  label: string
  category: string
  input_type: MetricInputType
  unit: string
  min: number
  max: number
  step: number
  active: boolean
  icon: string
  who_logs: string
  note: string
  sort_order: number
  coach_edited_fields: string[]
  updated_at: string
}

export interface ActivityTypeRow {
  key: string
  label: string
  distance_unit: string | null
  tracks: ('distance' | 'duration')[]
  icon: string
  note: string
  sort_order: number
  updated_at: string
}

export interface PlanSettingRow {
  key: string
  value: unknown
  coach_edited: boolean
  updated_at: string
}

export interface ProfileRow {
  id: string
  display_name: string
  role: 'trainee' | 'coach'
}

export interface OutboxRow {
  seq?: number
  table: string
  row_id: string
  payload: Record<string, unknown>
  created_at: string
  attempts: number
  last_error?: string
}

export interface MetaRow {
  key: string
  value: unknown
}
