/**
 * Hashing utilities for source text deduplication
 * Uses SHA-256 to create consistent hashes for duplicate detection
 */

import { createHash } from "node:crypto";

/**
 * Calculates SHA-256 hash of given text
 * Used to detect duplicate generation requests with same source text
 *
 * @param text - Source text to hash
 * @returns Hexadecimal SHA-256 hash string
 *
 * @example
 * ```typescript
 * const hash = await calculateSHA256("TypeScript is a strongly typed...");
 * // Returns: "a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5..."
 * ```
 */
export async function calculateSHA256(text: string): Promise<string> {
  const hash = createHash("sha256");
  hash.update(text);
  return hash.digest("hex");
}
