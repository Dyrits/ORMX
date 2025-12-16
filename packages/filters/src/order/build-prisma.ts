import type { Order } from "../types";

/**
 * Prisma orderBy type for an entity.
 */
export type PrismaOrderBy<TSelect> = { [Key in keyof TSelect]?: "asc" | "desc" };

/**
 * Converts a generic Order clause into Prisma-compatible format.
 * @todo Not yet implemented
 */
export function buildPrismaOrder<TSelect>(_order?: Order<TSelect>): PrismaOrderBy<TSelect> {
  return {};
}
