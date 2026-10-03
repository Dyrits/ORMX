import type { EntityMetadata, FilterQuery, FindOptions } from "@mikro-orm/core";
import type { QueryFilters } from "../types.js";
import { buildMikroOrmOrder } from "./order.js";
import { buildMikroOrmPopulateFilters, buildMikroOrmSelect } from "./select.js";
import { buildMikroOrmWhere } from "./where.js";

/**
 * Arguments of MikroORM's `em.find(entity, where, options)`.
 */
export type MikroOrmFilters<TEntity> = {
  where: FilterQuery<TEntity>;
  options: FindOptions<TEntity>;
};

/**
 * Converts QueryFilters to MikroORM `find` arguments.
 * Pass the entity metadata to load relations selected with `true` in full, see `buildMikroOrmSelect`.
 *
 * @example
 * ```ts
 * const { where, options } = buildMikroOrmFilters(filters, em.getMetadata().find(User));
 * const users = await em.find(User, where, options);
 * ```
 */
export function buildMikroOrmFilters<TEntity>(filters: QueryFilters<TEntity>, metadata?: EntityMetadata): MikroOrmFilters<TEntity> {
  const options: Record<string, unknown> = { ...buildMikroOrmPopulateFilters(filters.select) };

  const fields = buildMikroOrmSelect(filters.select, metadata);
  if (fields) {
    options.fields = fields;
  }

  const orderBy = buildMikroOrmOrder(filters.order);
  if (orderBy) {
    options.orderBy = orderBy;
  }

  if (filters.limit !== undefined) {
    options.limit = filters.limit;
  }

  if (filters.offset !== undefined) {
    options.offset = filters.offset;
  }

  return { options: options as FindOptions<TEntity>, where: buildMikroOrmWhere(filters.where) };
}
