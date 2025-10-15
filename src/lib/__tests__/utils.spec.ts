import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn utility", () => {
  it("łączy klasy CSS", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("obsługuje conditional classes", () => {
    const showHidden = false;
    const showVisible = true;
    const result = cn("base", showHidden && "hidden", showVisible && "visible");
    expect(result).toBe("base visible");
  });

  it("merguje konfliktujące klasy Tailwind", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("obsługuje undefined i null", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toBe("base extra");
  });

  it("obsługuje puste stringi", () => {
    const result = cn("base", "", "extra");
    expect(result).toBe("base extra");
  });

  it("obsługuje tablice klas", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("obsługuje obiekty z conditional classes", () => {
    const result = cn({
      base: true,
      hidden: false,
      visible: true,
    });
    expect(result).toBe("base visible");
  });

  it("zwraca pusty string dla pustych argumentów", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
