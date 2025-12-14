import type { GetColumn } from "../drizzle.types";
import type { Select } from "../types";

export type { GetColumn } from "../drizzle.types";

/**
 * Converts a generic Select clause into Drizzle-compatible format.
 * @todo Not yet implemented
 */
export function buildDrizzleSelect<TEntity>(_select: Select<TEntity> | undefined, _getColumn: GetColumn): Record<string, unknown> {
  return {};
}
