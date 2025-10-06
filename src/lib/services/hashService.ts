/**
 * Hash service for source text deduplication
 * Provides consistent hashing functionality across the application
 */

import { calculateSHA256 } from '../utils/hash';

/**
 * Service wrapper for hash calculation
 * Re-exports the hash utility for use in other services
 */
export { calculateSHA256 };

