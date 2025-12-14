import type { Select } from "../types";

/**
 * Prisma select type for an entity.
 */
export type PrismaSelect<TEntity> = { [Key in keyof TEntity]?: boolean };

/**
 * Converts a generic Select clause into Prisma-compatible format.
 * @todo Not yet implemented
 */
export function buildPrismaSelect<TEntity>(_select?: Select<TEntity>): PrismaSelect<TEntity> {
  return {};
}
