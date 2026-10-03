import { asc, desc, type SQL } from "drizzle-orm";
import { enabledEntries } from "../shared.js";
import type { Order, OrderDirection } from "../types.js";
import { type ColumnSource, resolveColumn } from "./columns.js";

/**
 * Converts a generic Order clause into Drizzle `orderBy` arguments.
 *
 * @example
 * ```ts
 * db.select().from(users).orderBy(...buildDrizzleOrder(order, users));
 * ```
 */
export function buildDrizzleOrder<TEntity>(order: Order<TEntity> | undefined, columns: ColumnSource): SQL[] {
  return enabledEntries<OrderDirection>(order).map(([field, direction]) => {
    const column = resolveColumn(columns, field);

    return direction === "desc" ? desc(column) : asc(column);
  });
}
