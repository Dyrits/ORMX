import { enabledEntries } from "../shared.js";
import type { Order, OrderDirection, ScalarKeys } from "../types.js";

/**
 * MikroORM `orderBy` map for an entity. Keys keep their insertion order, so the first key is the primary sort.
 */
export type MikroOrmOrderBy<TEntity> = { [Key in ScalarKeys<TEntity>]?: OrderDirection };

/**
 * Converts a generic Order clause into a MikroORM `orderBy` map.
 * Returns `undefined` when there is nothing to sort by, so the key can be omitted from the query.
 */
export function buildMikroOrmOrder<TEntity>(order?: Order<TEntity>): MikroOrmOrderBy<TEntity> | undefined {
  const output = Object.fromEntries(enabledEntries<OrderDirection>(order));

  return Object.keys(output).length > 0 ? (output as MikroOrmOrderBy<TEntity>) : undefined;
}
