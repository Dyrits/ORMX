import type { PrismaOrderBy } from "./order/build-prisma";
import { buildPrismaOrder } from "./order/build-prisma";
import type { PrismaSelect } from "./select/build-prisma";
import { buildPrismaSelect } from "./select/build-prisma";
import type { QueryFilters } from "./types";
import type { PrismaWhere } from "./where/build-prisma";
import { buildPrismaWhere } from "./where/build-prisma";

export type { PrismaOrderBy } from "./order/build-prisma";
export { buildPrismaOrder } from "./order/build-prisma";
export type { PrismaSelect } from "./select/build-prisma";
export { buildPrismaSelect } from "./select/build-prisma";
export type { PrismaFieldOperators, PrismaWhere } from "./where/build-prisma";
// Re-export builders and types
export { buildPrismaWhere } from "./where/build-prisma";

export type PrismaFilters<TEntity> = {
  where?: PrismaWhere<TEntity>;
  select?: PrismaSelect<TEntity>;
  orderBy?: PrismaOrderBy<TEntity>;
};

/**
 * Converts QueryFilters to Prisma query format.
 *
 * @example
 * ```ts
 * const filters: QueryFilters<User> = {
 *   where: { name: { Contains: "john" } }
 * };
 * const prismaQuery = buildPrismaFilters(filters);
 * // { where: { name: { contains: "john" } } }
 * ```
 */
export function buildPrismaFilters<TEntity>(filters: QueryFilters<TEntity>): PrismaFilters<TEntity> {
  return {
    orderBy: buildPrismaOrder(filters.order),
    select: buildPrismaSelect(filters.select),
    where: buildPrismaWhere(filters.where),
  };
}
