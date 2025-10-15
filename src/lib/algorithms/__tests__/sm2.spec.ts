import { describe, expect, it, beforeEach } from "vitest";
import { sm2Algorithm } from "../sm2";
import type { SM2ReviewData } from "@/types";

describe("SM2Algorithm", () => {
  describe("initializeCard", () => {
    it("tworzy nowe dane SM2 dla fiszki", () => {
      const result = sm2Algorithm.initializeCard(1);

      expect(result).toMatchObject({
        flashcard_id: 1,
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        last_reviewed: null,
      });
      expect(result.next_review).toBeDefined();
    });

    it("ustawia next_review na teraz (fiszka od razu dostępna)", () => {
      const result = sm2Algorithm.initializeCard(1);
      const nextReview = new Date(result.next_review);
      const now = new Date();

      // Różnica powinna być mniejsza niż 1 sekunda
      expect(Math.abs(nextReview.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe("review", () => {
    let initialData: SM2ReviewData;

    beforeEach(() => {
      initialData = sm2Algorithm.initializeCard(1);
    });

    it("quality 0 (Again) resetuje interval i repetitions", () => {
      const data = { ...initialData, repetitions: 5, interval: 10 };
      const result = sm2Algorithm.review(data, 0);

      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
    });

    it("quality 1 (Hard) resetuje interval i repetitions", () => {
      const data = { ...initialData, repetitions: 3, interval: 7 };
      const result = sm2Algorithm.review(data, 1);

      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
    });

    it("quality 2 (Good) - pierwsza powtórka ustawia interval na 1 dzień", () => {
      const result = sm2Algorithm.review(initialData, 2);

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("quality 2 (Good) - druga powtórka ustawia interval na 6 dni", () => {
      const data = { ...initialData, repetitions: 1, interval: 1 };
      const result = sm2Algorithm.review(data, 2);

      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("quality 2 (Good) - trzecia+ powtórka mnoży interval przez easiness", () => {
      const data = { ...initialData, repetitions: 2, interval: 6, easiness: 2.5 };
      const result = sm2Algorithm.review(data, 2);

      expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
      expect(result.repetitions).toBe(3);
    });

    it("quality 3 (Easy) dodaje bonus 1.3x do interwału", () => {
      const data = { ...initialData, repetitions: 2, interval: 6, easiness: 2.5 };
      const result = sm2Algorithm.review(data, 3);

      const expectedInterval = Math.round(6 * 2.5 * 1.3); // 19.5 -> 20
      expect(result.interval).toBe(expectedInterval);
      expect(result.repetitions).toBe(3);
    });

    it("easiness zmniejsza się dla słabych odpowiedzi", () => {
      const data = { ...initialData, easiness: 2.5 };
      const result = sm2Algorithm.review(data, 0);

      expect(result.easiness).toBeLessThan(2.5);
    });

    it("easiness zwiększa się dla dobrych odpowiedzi", () => {
      const data = { ...initialData, easiness: 2.0 };
      const result = sm2Algorithm.review(data, 3);

      expect(result.easiness).toBeGreaterThan(2.0);
    });

    it("easiness nie spada poniżej minEasiness (1.3)", () => {
      let data = { ...initialData, easiness: 1.4 };

      // Wielokrotne złe odpowiedzi
      for (let i = 0; i < 10; i++) {
        data = sm2Algorithm.review(data, 0);
      }

      expect(data.easiness).toBeGreaterThanOrEqual(1.3);
    });

    it("easiness nie rośnie powyżej maxEasiness (2.5)", () => {
      let data = { ...initialData, easiness: 2.4, repetitions: 3, interval: 10 };

      // Wielokrotne doskonałe odpowiedzi
      for (let i = 0; i < 10; i++) {
        data = sm2Algorithm.review(data, 3);
      }

      expect(data.easiness).toBeLessThanOrEqual(2.5);
    });

    it("ustawia last_reviewed na teraz", () => {
      const before = new Date();
      const result = sm2Algorithm.review(initialData, 2);
      const after = new Date();

      expect(result.last_reviewed).toBeDefined();
      const lastReviewed = new Date(result.last_reviewed ?? new Date());
      expect(lastReviewed.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastReviewed.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("ustawia next_review w przyszłości zgodnie z intervalem", () => {
      const result = sm2Algorithm.review(initialData, 2);
      const nextReview = new Date(result.next_review);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.interval);

      // Sprawdź dzień (ignoruj godziny/minuty)
      expect(nextReview.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  describe("isDue", () => {
    it("zwraca true dla fiszki z next_review w przeszłości", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const data: SM2ReviewData = {
        flashcard_id: 1,
        easiness: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: pastDate.toISOString(),
        last_reviewed: null,
      };

      expect(sm2Algorithm.isDue(data)).toBe(true);
    });

    it("zwraca true dla fiszki z next_review teraz", () => {
      const now = new Date();

      const data: SM2ReviewData = {
        flashcard_id: 1,
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: now.toISOString(),
        last_reviewed: null,
      };

      expect(sm2Algorithm.isDue(data)).toBe(true);
    });

    it("zwraca false dla fiszki z next_review w przyszłości", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const data: SM2ReviewData = {
        flashcard_id: 1,
        easiness: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: futureDate.toISOString(),
        last_reviewed: null,
      };

      expect(sm2Algorithm.isDue(data)).toBe(false);
    });
  });

  describe("sortByPriority", () => {
    it("sortuje fiszki due przed not-due", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const cards = [
        { id: 1, sm2Data: { ...sm2Algorithm.initializeCard(1), next_review: futureDate.toISOString() } },
        { id: 2, sm2Data: { ...sm2Algorithm.initializeCard(2), next_review: pastDate.toISOString() } },
      ];

      const sorted = sm2Algorithm.sortByPriority(cards);
      expect(sorted[0].id).toBe(2); // due card first
      expect(sorted[1].id).toBe(1);
    });

    it("sortuje fiszki due według najstarszego next_review", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const cards = [
        { id: 1, sm2Data: { ...sm2Algorithm.initializeCard(1), next_review: yesterday.toISOString() } },
        { id: 2, sm2Data: { ...sm2Algorithm.initializeCard(2), next_review: twoDaysAgo.toISOString() } },
      ];

      const sorted = sm2Algorithm.sortByPriority(cards);
      expect(sorted[0].id).toBe(2); // older due date first
      expect(sorted[1].id).toBe(1);
    });

    it("sortuje nowe fiszki (repetitions=0) przed learned", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const cards = [
        {
          id: 1,
          sm2Data: { ...sm2Algorithm.initializeCard(1), repetitions: 5, next_review: futureDate.toISOString() },
        },
        {
          id: 2,
          sm2Data: { ...sm2Algorithm.initializeCard(2), repetitions: 0, next_review: futureDate.toISOString() },
        },
      ];

      const sorted = sm2Algorithm.sortByPriority(cards);
      expect(sorted[0].id).toBe(2); // new card first
      expect(sorted[1].id).toBe(1);
    });

    it("nie modyfikuje oryginalnej tablicy", () => {
      const cards = [
        { id: 1, sm2Data: sm2Algorithm.initializeCard(1) },
        { id: 2, sm2Data: sm2Algorithm.initializeCard(2) },
      ];

      const original = [...cards];
      sm2Algorithm.sortByPriority(cards);

      expect(cards).toEqual(original);
    });
  });
});
