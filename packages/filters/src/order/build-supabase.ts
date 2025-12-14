import type { Order } from "../types";
import type { SupabaseFilterBuilder } from "../where/build-supabase";

export type { SupabaseFilterBuilder };

/**
 * Applies Order to a Supabase query builder.
 * @todo Not yet implemented
 */
export function buildSupabaseOrder<TEntity>(query: SupabaseFilterBuilder<TEntity>, _order?: Order<TEntity>): SupabaseFilterBuilder<TEntity> {
  return query;
}
