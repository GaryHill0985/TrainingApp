/** Types mirroring lucas_plan_seed.json. The seed is the single source of truth for plan content. */

export type PositionTag = 'Lengthened' | 'Mid-range' | 'Shortened' | 'Trunk' | 'Full-range' | 'Easy'
export type TechniqueColour = 'green' | 'amber' | 'red'
export type MuscleRole = 'prime' | 'synergist' | 'stabiliser'

export interface PositionInfo {
  plain: string
  meaning: string
  colour: string
}

export interface WorkoutItem {
  order: number
  exercise_id: string
  sets: number
  rep_range: string
  rest: string
  effort_target: string
  warmup_sets: number
  position: PositionTag
}

export interface Workout {
  id: string
  name: string
  subtitle: string
  demand: string
  items: WorkoutItem[]
}

export interface MuscleInvolvement {
  prime_movers: string[]
  synergists: string[]
  stabilisers: string[]
}

export interface Exercise {
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
  muscle_involvement: MuscleInvolvement
  /** Coach-set: name to search in Muscle & Motion, or a deep link. */
  mm_reference?: string
}

export interface Muscle {
  id: string
  name: string
  region: string
  origin: string
  insertion: string
  action: string
  line_of_pull: string
  two_joint: boolean
  note: string
}

export type MetricInputType = 'number' | 'hours' | 'scale_1_5' | 'scale_1_10'

export interface MetricDefinition {
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
  who_logs: 'trainee' | 'coach'
  note?: string
}

export interface ActivityType {
  key: string
  label: string
  distance_unit: string | null
  tracks: ('distance' | 'duration')[]
  icon: string
  note?: string
}

export interface ProcessMilestone {
  key: string
  label: string
  type: 'habit' | 'performance'
  detail: string
  stages?: string[]
}

export interface PlanEvent {
  key: string
  name: string
  venue: string
  date: string
  date_end: string
  countdown: boolean
  goal: string
  note: string
}

export interface Palette {
  bg: string; surface: string; surface2: string; text: string; muted: string
  accent: string; accent2: string; line: string; danger: string; warn: string; ok: string
}

export interface PlanSeed {
  meta: {
    plan_name: string
    version: string
    mantra: string
    trainee: { name: string; notes: string }
    coach: { name: string; notes: string }
    effort_model: string
    progression_model: string
    technique_colours: Record<TechniqueColour, string>
    week: { day: string; workout: string }[]
    safety_rules: string[]
    anatomy_data_note: string
    anatomy_sources: { name: string; what: string; licence: string; url?: string; maintainer?: string }[]
    do_not_copy: string
    muscle_visual_plan: string
  }
  goals: {
    vision: {
      title: string
      statement: string
      images: string[]
      images_caption: string
      max_images: number
      images_note: string
      framing: string
    }
    process_milestones: ProcessMilestone[]
    coach_note: string
  }
  events: PlanEvent[]
  theme: {
    default: 'athletic_dark' | 'light_highcontrast'
    palettes: Record<'athletic_dark' | 'light_highcontrast', Palette>
    position_chip_colours: Record<'dark' | 'light', Record<PositionTag, string>>
    coach_can_switch: boolean
  }
  positions: Record<PositionTag, PositionInfo>
  metrics: MetricDefinition[]
  activity_types: ActivityType[]
  muscles: Record<string, Muscle>
  workouts: Workout[]
  exercises: Record<string, Exercise>
}
