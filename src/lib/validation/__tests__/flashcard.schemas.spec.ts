import { describe, expect, it } from "vitest";
import {
  flashcardListQuerySchema,
  flashcardCreateSchema,
  flashcardBatchCreateSchema,
  flashcardUpdateSchema,
  flashcardIdParamSchema,
  flashcardFormSchema,
  flashcardSourceEnum,
} from "../flashcard.schemas";

describe("flashcard.schemas", () => {
  describe("flashcardSourceEnum", () => {
    it("akceptuje poprawne wartości", () => {
      expect(() => flashcardSourceEnum.parse("ai-full")).not.toThrow();
      expect(() => flashcardSourceEnum.parse("ai-edited")).not.toThrow();
      expect(() => flashcardSourceEnum.parse("manual")).not.toThrow();
    });

    it("odrzuca niepoprawne wartości", () => {
      expect(() => flashcardSourceEnum.parse("invalid")).toThrow();
    });
  });

  describe("flashcardListQuerySchema", () => {
    it("parsuje poprawne query params", () => {
      const result = flashcardListQuerySchema.parse({
        page: "2",
        limit: "25",
        source: "ai-full",
        search: "test",
      });

      expect(result).toEqual({
        page: 2,
        limit: 25,
        source: "ai-full",
        search: "test",
      });
    });

    it("używa domyślnych wartości", () => {
      const result = flashcardListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it("odrzuca page < 1", () => {
      expect(() => flashcardListQuerySchema.parse({ page: 0 })).toThrow();
    });

    it("odrzuca limit > 100", () => {
      expect(() => flashcardListQuerySchema.parse({ limit: 101 })).toThrow();
    });

    it("source jest opcjonalny", () => {
      const result = flashcardListQuerySchema.parse({ page: 1 });
      expect(result.source).toBeUndefined();
    });

    it("search jest opcjonalny", () => {
      const result = flashcardListQuerySchema.parse({ page: 1 });
      expect(result.search).toBeUndefined();
    });
  });

  describe("flashcardCreateSchema", () => {
    it("parsuje poprawne dane", () => {
      const result = flashcardCreateSchema.parse({
        front: "Pytanie",
        back: "Odpowiedź",
        source: "manual",
      });

      expect(result).toEqual({
        front: "Pytanie",
        back: "Odpowiedź",
        source: "manual",
      });
    });

    it("trimuje whitespace", () => {
      const result = flashcardCreateSchema.parse({
        front: "  Pytanie  ",
        back: "  Odpowiedź  ",
        source: "manual",
      });

      expect(result.front).toBe("Pytanie");
      expect(result.back).toBe("Odpowiedź");
    });

    it("odrzuca pusty front", () => {
      expect(() =>
        flashcardCreateSchema.parse({
          front: "",
          back: "Odpowiedź",
          source: "manual",
        })
      ).toThrow();
    });

    it("odrzuca pusty back", () => {
      expect(() =>
        flashcardCreateSchema.parse({
          front: "Pytanie",
          back: "",
          source: "manual",
        })
      ).toThrow();
    });

    it("odrzuca front > 200 znaków", () => {
      expect(() =>
        flashcardCreateSchema.parse({
          front: "a".repeat(201),
          back: "Odpowiedź",
          source: "manual",
        })
      ).toThrow();
    });

    it("odrzuca back > 500 znaków", () => {
      expect(() =>
        flashcardCreateSchema.parse({
          front: "Pytanie",
          back: "a".repeat(501),
          source: "manual",
        })
      ).toThrow();
    });

    it("generation_id jest opcjonalny", () => {
      const result = flashcardCreateSchema.parse({
        front: "Pytanie",
        back: "Odpowiedź",
        source: "manual",
      });

      expect(result.generation_id).toBeUndefined();
    });
  });

  describe("flashcardBatchCreateSchema", () => {
    it("parsuje tablicę fiszek", () => {
      const result = flashcardBatchCreateSchema.parse({
        flashcards: [
          { front: "Q1", back: "A1", source: "ai-full" },
          { front: "Q2", back: "A2", source: "ai-full" },
        ],
      });

      expect(result.flashcards).toHaveLength(2);
    });

    it("odrzuca pustą tablicę", () => {
      expect(() => flashcardBatchCreateSchema.parse({ flashcards: [] })).toThrow();
    });

    it("odrzuca tablicę > 50 elementów", () => {
      const flashcards = Array(51).fill({
        front: "Q",
        back: "A",
        source: "ai-full",
      });

      expect(() => flashcardBatchCreateSchema.parse({ flashcards })).toThrow();
    });
  });

  describe("flashcardUpdateSchema", () => {
    it("parsuje update z front", () => {
      const result = flashcardUpdateSchema.parse({ front: "Nowe pytanie" });
      expect(result.front).toBe("Nowe pytanie");
    });

    it("parsuje update z back", () => {
      const result = flashcardUpdateSchema.parse({ back: "Nowa odpowiedź" });
      expect(result.back).toBe("Nowa odpowiedź");
    });

    it("parsuje update z obydwoma polami", () => {
      const result = flashcardUpdateSchema.parse({
        front: "Nowe pytanie",
        back: "Nowa odpowiedź",
      });

      expect(result.front).toBe("Nowe pytanie");
      expect(result.back).toBe("Nowa odpowiedź");
    });

    it("odrzuca pusty obiekt", () => {
      expect(() => flashcardUpdateSchema.parse({})).toThrow();
    });

    it("trimuje whitespace", () => {
      const result = flashcardUpdateSchema.parse({ front: "  Test  " });
      expect(result.front).toBe("Test");
    });
  });

  describe("flashcardIdParamSchema", () => {
    it("parsuje string na number", () => {
      const result = flashcardIdParamSchema.parse("123");
      expect(result).toBe(123);
    });

    it("parsuje number", () => {
      const result = flashcardIdParamSchema.parse(123);
      expect(result).toBe(123);
    });

    it("odrzuca wartości <= 0", () => {
      expect(() => flashcardIdParamSchema.parse(0)).toThrow();
      expect(() => flashcardIdParamSchema.parse(-1)).toThrow();
    });

    it("odrzuca non-integer", () => {
      expect(() => flashcardIdParamSchema.parse(1.5)).toThrow();
    });
  });

  describe("flashcardFormSchema", () => {
    it("parsuje poprawne dane formularza", () => {
      const result = flashcardFormSchema.parse({
        front: "Pytanie",
        back: "Odpowiedź",
      });

      expect(result).toEqual({
        front: "Pytanie",
        back: "Odpowiedź",
      });
    });

    it("ma polskie komunikaty błędów", () => {
      try {
        flashcardFormSchema.parse({ front: "", back: "Test" });
      } catch (error: unknown) {
        const err = error as { errors?: { message: string }[] };
        expect(err.errors?.[0].message).toContain("wymagany");
      }
    });

    it("waliduje maksymalną długość z polskim komunikatem", () => {
      try {
        flashcardFormSchema.parse({
          front: "a".repeat(201),
          back: "Test",
        });
      } catch (error: unknown) {
        const err = error as { errors?: { message: string }[] };
        expect(err.errors?.[0].message).toContain("maksymalnie");
      }
    });
  });
});
