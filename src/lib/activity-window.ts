/**
 * Enforces the spec's core rule (§4): an activity's start time must be
 * within 48 hours of when it's created. Mirrored by a Postgres check
 * constraint server-side — this is the client-side copy so the create-
 * activity form can reject bad input before it ever hits the network.
 */
const MAX_HORIZON_MS = 48 * 60 * 60 * 1000;

export function isWithinActivityHorizon(createdAt: Date, startsAt: Date): boolean {
  const delta = startsAt.getTime() - createdAt.getTime();
  return delta >= 0 && delta <= MAX_HORIZON_MS;
}

export function hoursUntilHorizonCutoff(createdAt: Date): number {
  return MAX_HORIZON_MS / (60 * 60 * 1000) - (Date.now() - createdAt.getTime()) / (60 * 60 * 1000);
}
