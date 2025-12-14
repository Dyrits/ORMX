import type { Select } from "../types";
import type { FilterBuilder } from "../where/build-supabase";

export type { FilterBuilder };

/**
 * Applies Select to a Supabase query builder.
 * @todo Not yet implemented
 */
export function buildSupabaseSelect<TEntity>(query: FilterBuilder<TEntity>, _select?: Select<TEntity>): FilterBuilder<TEntity> {
  return query;
}
