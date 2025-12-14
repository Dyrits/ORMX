import type { Order } from "../types";
import type { FilterBuilder } from "../where/build-supabase";

export type { FilterBuilder };

/**
 * Applies Order to a Supabase query builder.
 * @todo Not yet implemented
 */
export function buildSupabaseOrder<TEntity>(query: FilterBuilder<TEntity>, _order?: Order<TEntity>): FilterBuilder<TEntity> {
  return query;
}
