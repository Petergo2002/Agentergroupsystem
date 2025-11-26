import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      const result = cn("px-4", "py-2", "bg-blue-500");
      expect(result).toBe("px-4 py-2 bg-blue-500");
    });

    it("should handle conditional classes", () => {
      const result = cn(
        "base-class",
        true && "conditional-class",
        false && "hidden-class",
      );
      expect(result).toBe("base-class conditional-class");
    });

    it("should merge tailwind classes correctly", () => {
      const result = cn("px-4 py-2", "px-6");
      expect(result).toBe("py-2 px-6");
    });

    it("should handle undefined and null values", () => {
      const result = cn("base-class", undefined, null, "another-class");
      expect(result).toBe("base-class another-class");
    });
  });
});
