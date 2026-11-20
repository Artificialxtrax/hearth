import "server-only";

/**
 * Hearth runs on a local in-memory desk by default (`lib/store.ts`).
 * This module stays in the tree so a future hosted database can be wired
 * deliberately. It never opens a connection on its own.
 */
export function hostedDatabaseEnabled() {
  return false;
}
