import type { Select } from "../types";
import type { SupabaseFilterBuilder } from "../where/build-supabase";

export type { SupabaseFilterBuilder };

/**
 * Applies Select to a Supabase query builder.
 * @todo Not yet implemented
 */
export function buildSupabaseSelect<TSelect>(query: SupabaseFilterBuilder<TSelect>, _select?: Select<TSelect>): SupabaseFilterBuilder<TSelect> {
  return query;
}
