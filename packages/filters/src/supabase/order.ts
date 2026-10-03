import { enabledEntries } from "../shared.js";
import type { Order, OrderDirection } from "../types.js";
import { reference, type SupabaseQuery } from "./query.js";

/**
 * Applies a generic Order clause to a Supabase query builder.
 * Pass `path` to sort rows of an embedded resource instead of the top-level table.
 */
export function buildSupabaseOrder<TQuery extends SupabaseQuery, TEntity>(query: TQuery, order?: Order<TEntity>, path?: string): TQuery {
  let output: SupabaseQuery = query;

  for (const [field, direction] of enabledEntries<OrderDirection>(order)) {
    output = output.order(field, { ascending: direction === "asc", ...reference(path) });
  }

  return output as TQuery;
}
