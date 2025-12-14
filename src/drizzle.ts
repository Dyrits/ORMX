import type { AnyColumn, SQL } from "drizzle-orm";
import { and, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, sql } from "drizzle-orm";
import type { Operator, QueryFilters, Where } from "./types";

/**
 * Function to resolve a field name to a Drizzle column.
 */
export type GetColumn = (field: string) => AnyColumn;

const TRUE = sql`true`;

const operators: Record<Operator, (column: AnyColumn, value?: unknown) => SQL> = {
  Contains: (column, value) => ilike(column, `%${String(value)}%`),
  EndsWith: (column, value) => ilike(column, `%${String(value)}`),
  GT: (column, value) => gt(column, value),
  GTE: (column, value) => gte(column, value),
  In: (column, value) => inArray(column, value as unknown[]),
  Is: (column, value) => eq(column, value),
  IsNot: (column, value) => ne(column, value),
  IsNotNull: (column) => isNotNull(column),
  IsNull: (column) => isNull(column),
  LT: (column, value) => lt(column, value),
  LTE: (column, value) => lte(column, value),
  NotIn: (column, value) => notInArray(column, value as unknown[]),
  StartsWith: (column, value) => ilike(column, `${String(value)}%`),
};

function buildWhere<TEntity>(where: Where<TEntity>, getColumn: GetColumn): SQL {
  const output: SQL[] = [];

  for (const [key, value] of Object.entries(where) as [keyof Where<TEntity>, Where<TEntity>[keyof Where<TEntity>]][]) {
    if (key === "OneOf") {
      if (Array.isArray(value)) {
        const groups = value as Where<TEntity>[];
        const $or = groups.map(($where) => buildWhere($where, getColumn));
        if ($or.length > 0) {
          output.push(or(...$or) as SQL);
        }
      }
      continue;
    }

    if (!value) {
      continue;
    }

    type FieldKey = keyof TEntity;
    const field = key as FieldKey;
    const column = getColumn(field as string);
    const condition = value as Partial<Record<Operator, TEntity[FieldKey] | TEntity[FieldKey][] | null>>;

    const drizzle$operators: SQL[] = [];

    for (const [operator, $value] of Object.entries(condition) as [Operator, TEntity[FieldKey] | TEntity[FieldKey][] | null][]) {
      if (operator === "IsNull") {
        drizzle$operators.push(isNull(column));
        continue;
      }

      if (operator === "IsNotNull") {
        drizzle$operators.push(isNotNull(column));
        continue;
      }

      if ($value == null) {
        continue;
      }

      drizzle$operators.push(operators[operator](column, $value));
    }

    if (drizzle$operators.length > 0) {
      output.push(and(...drizzle$operators) as SQL);
    }
  }

  if (output.length === 0) {
    return TRUE;
  }

  if (output.length === 1) {
    return output[0];
  }

  return and(...output) as SQL;
}

/**
 * Converts QueryFilters to Drizzle where clause.
 *
 * @example
 * ```ts
 * import { users } from './schema';
 *
 * const filters: QueryFilters<User> = {
 *   where: { name: { Contains: "john" } }
 * };
 *
 * const getColumn = (field: string) => users[field as keyof typeof users];
 * const { where } = toDrizzle(filters, getColumn);
 *
 * db.select().from(users).where(where);
 * ```
 */
export function toDrizzle<TEntity>(filters: QueryFilters<TEntity>, getColumn: GetColumn): { where: SQL } {
  return {
    where: filters.where ? buildWhere(filters.where, getColumn) : TRUE,
  };
}
