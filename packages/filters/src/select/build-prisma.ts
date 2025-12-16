import type { Select } from "../types";

/**
 * Prisma select type for an entity.
 */
export type PrismaSelect<TSelect> = { [Key in keyof TSelect]?: boolean };

/**
 * Converts a generic Select clause into Prisma-compatible format.
 * @todo Not yet implemented
 */
export function buildPrismaSelect<TSelect>(_select?: Select<TSelect>): PrismaSelect<TSelect> {
  return {};
}
