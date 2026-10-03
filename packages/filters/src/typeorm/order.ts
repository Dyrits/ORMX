import type { FindOptionsOrder } from "typeorm";
import { enabledEntries } from "../shared.js";
import type { Order, OrderDirection } from "../types.js";

/** Converts a generic Order clause into TypeORM find options. */
export function buildTypeOrmOrder<TEntity>(order?: Order<TEntity>): FindOptionsOrder<TEntity> | undefined {
  const output = Object.fromEntries(enabledEntries<OrderDirection>(order));
  return Object.keys(output).length > 0 ? (output as FindOptionsOrder<TEntity>) : undefined;
}
