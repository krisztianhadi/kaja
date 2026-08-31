import { describe, expect, it } from "vitest";
import { parseBackdate } from "@/lib/backdate";

const NOW = new Date("2026-08-30T10:00:00+07:00");

describe("parseBackdate", () => {
  it("returns the description unchanged when no time phrase is present", () => {
    const r = parseBackdate("chicken pad thai", NOW);
    expect(r.createdAt).toBeNull();
    expect(r.clean).toBe("chicken pad thai");
  });

  it("shifts 'yesterday' back one day and strips the phrase", () => {
    const r = parseBackdate("yesterday som tum", NOW);
    expect(r.createdAt?.getTime()).toBe(NOW.getTime() - 86_400_000);
    expect(r.clean).toBe("som tum");
  });

  it("handles 'last night'", () => {
    const r = parseBackdate("last night khao soi", NOW);
    expect(r.createdAt?.getTime()).toBe(NOW.getTime() - 86_400_000);
    expect(r.clean).toBe("khao soi");
  });

  it("handles 'N days ago'", () => {
    const r = parseBackdate("3 days ago pizza", NOW);
    expect(r.createdAt?.getTime()).toBe(NOW.getTime() - 3 * 86_400_000);
    expect(r.clean).toBe("pizza");
  });

  it("handles 'the day before yesterday'", () => {
    const r = parseBackdate("the day before yesterday rice soup", NOW);
    expect(r.createdAt?.getTime()).toBe(NOW.getTime() - 2 * 86_400_000);
    expect(r.clean).toBe("rice soup");
  });

  it("clamps 'this morning' to 8am, never in the future", () => {
    const r = parseBackdate("this morning eggs", NOW);
    expect(r.createdAt!.getHours()).toBe(8);
    expect(r.createdAt!.getTime()).toBeLessThanOrEqual(NOW.getTime());
    expect(r.clean).toBe("eggs");
  });

  it("falls back to photo-only placeholder when only the phrase was typed", () => {
    const r = parseBackdate("yesterday", NOW);
    expect(r.createdAt).not.toBeNull();
    expect(r.clean).toContain("photo only");
  });
});
