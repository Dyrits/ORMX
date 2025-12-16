import type { SQL } from "drizzle-orm";
import type { GetColumn } from "./drizzle.types";
import { buildDrizzleOrder } from "./order/build-drizzle";
import { buildDrizzleSelect } from "./select/build-drizzle";
import type { QueryFilters } from "./types";
import { buildDrizzleWhere } from "./where/build-drizzle";

// Re-export builders and types
export type { GetColumn } from "./drizzle.types";
export { buildDrizzleOrder } from "./order/build-drizzle";
export { buildDrizzleSelect } from "./select/build-drizzle";
export { buildDrizzleWhere } from "./where/build-drizzle";

export type DrizzleFilters = {
  where: SQL;
  select: Record<string, unknown>;
  orderBy: SQL;
};

/**
 * Converts QueryFilters to Drizzle query format.
 *
 * @example
 * ```ts
 * import { users } from './schema';
 *
 * const filters: QueryFilters<User> = {
 *   where: { name: { Contains: "john" } }
 * };
 *
 * const getColumn = (field: string) => users[field as keyof typeof users];
 * const { where } = buildDrizzleFilters(filters, getColumn);
 *
 * db.select().from(users).where(where);
 * ```
 */
export function buildDrizzleFilters<TSelect>(filters: QueryFilters<TSelect>, getColumn: GetColumn): DrizzleFilters {
  return {
    orderBy: buildDrizzleOrder(filters.order || {}, getColumn),
    select: buildDrizzleSelect(filters.select || {}, getColumn),
    where: buildDrizzleWhere(filters.where || {}, getColumn),
  };
}
