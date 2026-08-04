import type { Engagement, Phase, PhaseStatus, Sprint } from '../types'

export const engagementStatusLabels: Record<Engagement['status'], string> = {
    pending_advance: 'pending advance',
    in_progress: 'in progress',
    delivered: 'delivered',
}

export const phaseStatusLabels: Record<PhaseStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
}

/** Default phase checklist for a newly added sprint. */
export const defaultPhaseTemplate = ['Analysis', 'Design', 'Development', 'Testing', 'Deploy']

// The single phase shown on customer-facing summaries: the first one in
// progress, else the first not yet started, else the last (all done).
export function currentPhase(phases: Phase[]): Phase | null {
    if (phases.length === 0) return null
    return phases.find((p) => p.status === 'in_progress') ?? phases.find((p) => p.status === 'not_started') ?? phases[phases.length - 1]
}

// The active sprint: the first one with any phase not yet completed, else
// the last sprint (everything done).
export function currentSprint(sprints: Sprint[]): Sprint | null {
    if (sprints.length === 0) return null
    return sprints.find((s) => s.phases.some((p) => p.status !== 'completed')) ?? sprints[sprints.length - 1]
}

// The project has reached the delivery stage once the last phase of the
// last sprint has been started — used to gate revealing the final invoice
// to the customer and showing the "Mark Delivered" action to admin.
export function hasReachedDelivery(sprints: Sprint[]): boolean {
    if (sprints.length === 0) return false
    const lastSprint = sprints[sprints.length - 1]
    if (lastSprint.phases.length === 0) return false
    return lastSprint.phases[lastSprint.phases.length - 1].status !== 'not_started'
}
