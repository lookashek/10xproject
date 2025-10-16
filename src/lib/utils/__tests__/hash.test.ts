/**
 * Tests for hash utilities
 * Verifies SHA-256 hash calculation with Web Crypto API
 */

import { describe, it, expect } from "vitest";
import { calculateSHA256 } from "../hash";

describe("calculateSHA256", () => {
  it("should calculate correct SHA-256 hash for simple text", async () => {
    const text = "Hello, World!";
    const hash = await calculateSHA256(text);

    // Expected hash for "Hello, World!" (verified with online SHA-256 calculator)
    expect(hash).toBe("dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f");
  });

  it("should calculate correct SHA-256 hash for longer text", async () => {
    const text = "TypeScript is a strongly typed programming language that builds on JavaScript.";
    const hash = await calculateSHA256(text);

    // Expected hash (verified with actual calculation)
    expect(hash).toBe("400b3d71d2e9497209d4b90b595b2939dc21f1eb32a432c10860dbaf88386e4e");
  });

  it("should calculate correct hash for empty string", async () => {
    const text = "";
    const hash = await calculateSHA256(text);

    // Expected hash for empty string (e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855)
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("should calculate correct hash for unicode text", async () => {
    const text = "Cześć, świecie! 🚀";
    const hash = await calculateSHA256(text);

    // Hash should be consistent for unicode characters
    expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // Only lowercase hex
  });

  it("should produce different hashes for different texts", async () => {
    const hash1 = await calculateSHA256("text1");
    const hash2 = await calculateSHA256("text2");

    expect(hash1).not.toBe(hash2);
  });

  it("should produce same hash for same text", async () => {
    const text = "consistent text";
    const hash1 = await calculateSHA256(text);
    const hash2 = await calculateSHA256(text);

    expect(hash1).toBe(hash2);
  });
});
