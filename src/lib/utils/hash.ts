/**
 * Hashing utilities for source text deduplication
 * Uses SHA-256 to create consistent hashes for duplicate detection
 * Compatible with Cloudflare Workers (Web Crypto API)
 */

/**
 * Calculates SHA-256 hash of given text
 * Used to detect duplicate generation requests with same source text
 * Uses Web Crypto API for cross-platform compatibility (Node.js + Cloudflare Workers)
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
  // Encode text as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Calculate SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}
