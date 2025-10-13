import { describe, expect, it } from "vitest";
import {
  generationCreateSchema,
  generationListQuerySchema,
  generationIdSchema,
  proposedFlashcardSchema,
  proposedFlashcardsArraySchema,
} from "../generation.schemas";

describe("generation.schemas", () => {
  describe("generationCreateSchema", () => {
    it("parsuje poprawny source_text", () => {
      const text = "a".repeat(5000);
      const result = generationCreateSchema.parse({ source_text: text });
      expect(result.source_text).toBe(text);
    });

    it("trimuje whitespace", () => {
      const text = "  " + "a".repeat(5000) + "  ";
      const result = generationCreateSchema.parse({ source_text: text });
      expect(result.source_text).toBe("a".repeat(5000));
    });

    it("odrzuca tekst < 1000 znaków", () => {
      const text = "a".repeat(999);
      expect(() => generationCreateSchema.parse({ source_text: text })).toThrow();
    });

    it("odrzuca tekst > 10000 znaków", () => {
      const text = "a".repeat(10001);
      expect(() => generationCreateSchema.parse({ source_text: text })).toThrow();
    });

    it("akceptuje dokładnie 1000 znaków", () => {
      const text = "a".repeat(1000);
      expect(() => generationCreateSchema.parse({ source_text: text })).not.toThrow();
    });

    it("akceptuje dokładnie 10000 znaków", () => {
      const text = "a".repeat(10000);
      expect(() => generationCreateSchema.parse({ source_text: text })).not.toThrow();
    });
  });

  describe("generationListQuerySchema", () => {
    it("parsuje poprawne query params", () => {
      const result = generationListQuerySchema.parse({
        page: "3",
        limit: "15",
      });

      expect(result).toEqual({
        page: 3,
        limit: 15,
      });
    });

    it("używa domyślnych wartości", () => {
      const result = generationListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("odrzuca page < 1", () => {
      expect(() => generationListQuerySchema.parse({ page: 0 })).toThrow();
    });

    it("odrzuca limit > 50", () => {
      expect(() => generationListQuerySchema.parse({ limit: 51 })).toThrow();
    });

    it("coerce string na number", () => {
      const result = generationListQuerySchema.parse({
        page: "5",
        limit: "10",
      });

      expect(result.page).toBe(5);
      expect(result.limit).toBe(10);
    });
  });

  describe("generationIdSchema", () => {
    it("parsuje string na number", () => {
      const result = generationIdSchema.parse("42");
      expect(result).toBe(42);
    });

    it("parsuje number", () => {
      const result = generationIdSchema.parse(42);
      expect(result).toBe(42);
    });

    it("odrzuca wartości <= 0", () => {
      expect(() => generationIdSchema.parse(0)).toThrow();
      expect(() => generationIdSchema.parse(-1)).toThrow();
    });

    it("odrzuca non-integer", () => {
      expect(() => generationIdSchema.parse(3.14)).toThrow();
    });
  });

  describe("proposedFlashcardSchema", () => {
    it("parsuje poprawną fiszkę z LLM", () => {
      const result = proposedFlashcardSchema.parse({
        front: "Pytanie",
        back: "Odpowiedź",
      });

      expect(result).toEqual({
        front: "Pytanie",
        back: "Odpowiedź",
      });
    });

    it("trimuje whitespace", () => {
      const result = proposedFlashcardSchema.parse({
        front: "  Pytanie  ",
        back: "  Odpowiedź  ",
      });

      expect(result.front).toBe("Pytanie");
      expect(result.back).toBe("Odpowiedź");
    });

    it("odrzuca pusty front", () => {
      expect(() =>
        proposedFlashcardSchema.parse({ front: "", back: "Odpowiedź" })
      ).toThrow();
    });

    it("odrzuca pusty back", () => {
      expect(() =>
        proposedFlashcardSchema.parse({ front: "Pytanie", back: "" })
      ).toThrow();
    });

    it("odrzuca front > 200 znaków", () => {
      expect(() =>
        proposedFlashcardSchema.parse({
          front: "a".repeat(201),
          back: "Odpowiedź",
        })
      ).toThrow();
    });

    it("odrzuca back > 500 znaków", () => {
      expect(() =>
        proposedFlashcardSchema.parse({
          front: "Pytanie",
          back: "a".repeat(501),
        })
      ).toThrow();
    });
  });

  describe("proposedFlashcardsArraySchema", () => {
    it("parsuje tablicę fiszek", () => {
      const result = proposedFlashcardsArraySchema.parse([
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ]);

      expect(result).toHaveLength(2);
    });

    it("odrzuca pustą tablicę", () => {
      expect(() => proposedFlashcardsArraySchema.parse([])).toThrow();
    });

    it("waliduje każdą fiszkę w tablicy", () => {
      expect(() =>
        proposedFlashcardsArraySchema.parse([
          { front: "Q1", back: "A1" },
          { front: "", back: "A2" }, // invalid
        ])
      ).toThrow();
    });
  });
});

