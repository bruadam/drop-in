import { isWithinActivityHorizon } from "../activity-window";

describe("isWithinActivityHorizon", () => {
  const now = new Date("2026-09-17T12:00:00Z");

  it("accepts a start time a few hours out", () => {
    const startsAt = new Date("2026-09-17T19:00:00Z");
    expect(isWithinActivityHorizon(now, startsAt)).toBe(true);
  });

  it("accepts a start time exactly 48 hours out", () => {
    const startsAt = new Date("2026-09-19T12:00:00Z");
    expect(isWithinActivityHorizon(now, startsAt)).toBe(true);
  });

  it("rejects a start time past the 48-hour horizon", () => {
    const startsAt = new Date("2026-09-19T12:00:01Z");
    expect(isWithinActivityHorizon(now, startsAt)).toBe(false);
  });

  it("rejects a start time in the past", () => {
    const startsAt = new Date("2026-09-17T11:00:00Z");
    expect(isWithinActivityHorizon(now, startsAt)).toBe(false);
  });
});
