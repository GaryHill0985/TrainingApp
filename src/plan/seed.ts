import seedJson from '../../lucas_plan_seed.json'
import type { PlanSeed } from './types'

/**
 * The bundled seed. It ships inside the app so the plan is always available offline,
 * even on first launch with no connection. Once the device has synced, coach edits
 * from the database take precedence (see src/plan/usePlan.ts).
 */
export const seed = seedJson as unknown as PlanSeed

export const MANTRA = seed.meta.mantra
