import type { Order } from "../types";
import type { SupabaseFilterBuilder } from "../where/build-supabase";

export type { SupabaseFilterBuilder };

/**
 * Applies Order to a Supabase query builder.
 * @todo Not yet implemented
 */
export function buildSupabaseOrder<TSelect>(query: SupabaseFilterBuilder<TSelect>, _order?: Order<TSelect>): SupabaseFilterBuilder<TSelect> {
  return query;
}
