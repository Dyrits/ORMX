import { buildSupabaseOrder } from "./order/build-supabase";
import { buildSupabaseSelect } from "./select/build-supabase";
import type { QueryFilters } from "./types";
import type { SupabaseFilterBuilder } from "./where/build-supabase";
import { buildSupabaseWhere } from "./where/build-supabase";

export { buildSupabaseOrder } from "./order/build-supabase";
export { buildSupabaseSelect } from "./select/build-supabase";
export type { SupabaseFilterBuilder } from "./where/build-supabase";
// Re-export builders and types
export { buildSupabaseWhere } from "./where/build-supabase";

/**
 * Applies QueryFilters to a Supabase query builder.
 *
 * @example
 * ```ts
 * const filters: QueryFilters<User> = {
 *   where: { name: { Contains: "john" }, age: { GTE: 18 } }
 * };
 * const query = supabase.from('users').select();
 * const filteredQuery = buildSupabaseFilters(query, filters);
 * ```
 */
export function buildSupabaseFilters<TSelect>(query: SupabaseFilterBuilder<TSelect>, filters: QueryFilters<TSelect>): SupabaseFilterBuilder<TSelect> {
  let result = query;
  result = buildSupabaseWhere(result, filters.where);
  result = buildSupabaseSelect(result, filters.select);
  result = buildSupabaseOrder(result, filters.order);
  return result;
}
