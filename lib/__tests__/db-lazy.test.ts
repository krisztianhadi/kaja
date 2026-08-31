import { describe, expect, it } from "vitest";
// importing the module must not throw without DATABASE_URL - this is what
// broke next build's "Collecting page data" on Railway (build-time import
// of /api/meals + dashboard with no DB URL in the build env)
describe("lazy db client", () => {
  it("imports without DATABASE_URL set", async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      await import("@/lib/db");
      expect(true).toBe(true);
    } finally {
      if (prev) process.env.DATABASE_URL = prev;
    }
  });

  it("throws only when the client is actually used", async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const mod = await import("@/lib/db");
      expect(() => (mod as { getSql(): unknown }).getSql()).toThrow(
        "DATABASE_URL is not set"
      );
    } finally {
      if (prev) process.env.DATABASE_URL = prev;
    }
  });
});
