import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { GetColumn } from "../drizzle.types";
import type { Order } from "../types";

export type { GetColumn } from "../drizzle.types";

const TRUE = sql`true`;

/**
 * Converts a generic Order clause into Drizzle-compatible format.
 * @todo Not yet implemented
 */
export function buildDrizzleOrder<TEntity>(_order: Order<TEntity> | undefined, _getColumn: GetColumn): SQL {
  return TRUE;
}
