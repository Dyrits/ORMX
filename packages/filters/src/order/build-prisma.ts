import type { Order } from "../types";

/**
 * Prisma orderBy type for an entity.
 */
export type PrismaOrderBy<TEntity> = { [Key in keyof TEntity]?: "asc" | "desc" };

/**
 * Converts a generic Order clause into Prisma-compatible format.
 * @todo Not yet implemented
 */
export function buildPrismaOrder<TEntity>(_order?: Order<TEntity>): PrismaOrderBy<TEntity> {
  return {};
}
