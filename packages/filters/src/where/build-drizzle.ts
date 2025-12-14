import type { AnyColumn, SQL } from "drizzle-orm";
import { and, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, sql } from "drizzle-orm";
import type { GetColumn } from "../drizzle.types";
import type { Operator, Where } from "../types";

export type { GetColumn } from "../drizzle.types";

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

/**
 * Converts a generic Where clause into Drizzle-compatible SQL.
 */
export function buildDrizzleWhere<TEntity>(where: Where<TEntity> | undefined, getColumn: GetColumn): SQL {
  if (!where) {
    return TRUE;
  }

  const output: SQL[] = [];

  for (const [key, value] of Object.entries(where) as [keyof Where<TEntity>, Where<TEntity>[keyof Where<TEntity>]][]) {
    if (key === "OneOf") {
      if (Array.isArray(value)) {
        const groups = value as Where<TEntity>[];
        const $or = groups.map(($where) => buildDrizzleWhere($where, getColumn));
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
