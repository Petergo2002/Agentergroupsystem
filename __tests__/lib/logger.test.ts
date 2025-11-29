import { beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log info messages", () => {
    const consoleSpy = vi.spyOn(console, "log");
    logger.info("Test info message");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should log error messages", () => {
    const consoleSpy = vi.spyOn(console, "error");
    logger.error("Test error message");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should log warning messages", () => {
    const consoleSpy = vi.spyOn(console, "warn");
    logger.warn("Test warning message");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should include context in log messages", () => {
    const consoleSpy = vi.spyOn(console, "log");
    logger.info("Test message", { action: "login", userId: "123" });
    expect(consoleSpy).toHaveBeenCalled();
    const logMessage = consoleSpy.mock.calls[0]?.[0] ?? "";
    expect(logMessage).toContain("Test message");
    expect(logMessage).toContain("userId");
    expect(logMessage).toContain("123");
  });
});
