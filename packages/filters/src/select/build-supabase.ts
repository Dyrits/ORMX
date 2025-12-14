import type { Select } from "../types";
import type { SupabaseFilterBuilder } from "../where/build-supabase";

export type { SupabaseFilterBuilder };

/**
 * Applies Select to a Supabase query builder.
 * @todo Not yet implemented
 */
export function buildSupabaseSelect<TEntity>(query: SupabaseFilterBuilder<TEntity>, _select?: Select<TEntity>): SupabaseFilterBuilder<TEntity> {
  return query;
}
