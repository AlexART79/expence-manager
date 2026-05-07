// @vitest-environment node

import { describe, expect, it } from "vitest";
import config from "./vite.config";

describe("Vite dev server config", () => {
  it("keeps the frontend dev server on a fixed port", () => {
    expect(config).toMatchObject({
      server: {
        port: 5173,
        strictPort: true
      }
    });
  });
});
