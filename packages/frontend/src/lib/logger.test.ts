import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

describe("frontend logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes stable debug info warn and error methods", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createLogger("test");

    logger.debug("debug message", { requestId: "req-1" });
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(debug).toHaveBeenCalledWith("[test] debug message", { requestId: "req-1" });
    expect(info).toHaveBeenCalledWith("[test] info message", undefined);
    expect(warn).toHaveBeenCalledWith("[test] warn message", undefined);
    expect(error).toHaveBeenCalledWith("[test] error message", undefined);
  });
});
