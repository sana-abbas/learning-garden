import { describe, expect, it } from "vitest";
import { BEYOND_CODING_SESSIONS, attendanceRate, beyondCodingCoverage } from "./attendance";

describe("attendanceRate", () => {
  it("is null when nothing has counted yet, so the dashboard shows a dash", () => {
    expect(attendanceRate([])).toBeNull();
    expect(attendanceRate(["leave", "holiday", "paused"])).toBeNull();
  });

  it("excuses leave, holiday and pause, as the sheet did", () => {
    expect(attendanceRate(["attended", "absent", "leave", "holiday", "paused"])).toBe(50);
  });

  it("rounds to a whole percentage", () => {
    expect(attendanceRate(["attended", "attended", "absent"])).toBe(67);
  });
});

describe("beyondCodingCoverage", () => {
  it("counts a session once even when attended in both of the year's runs", () => {
    const result = beyondCodingCoverage(["Feedback", "Feedback"]);
    expect(result.covered).toBe(1);
    expect(result.total).toBe(BEYOND_CODING_SESSIONS.length);
  });

  it("matches names regardless of case and spacing", () => {
    expect(beyondCodingCoverage(["  time management "]).covered).toBe(1);
  });

  it("ignores sessions outside the curriculum", () => {
    expect(beyondCodingCoverage(["Personal branding"]).covered).toBe(0);
  });

  it("lists what is still to attend, in curriculum order", () => {
    const all = [...BEYOND_CODING_SESSIONS];
    const result = beyondCodingCoverage(all.slice(1));
    expect(result.missing).toEqual([all[0]]);
  });
});
