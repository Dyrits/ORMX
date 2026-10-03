import { type AnyColumn, and, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, type SQL } from "drizzle-orm";
import { activeOperators, escapeLike, splitWhere } from "../shared.js";
import type { Operator, Where } from "../types.js";
import { type ColumnSource, resolveColumn } from "./columns.js";

type Builder = (column: AnyColumn, value: unknown) => SQL;

const list =
  (build: (column: AnyColumn, values: unknown[]) => SQL): Builder =>
  (column, value) =>
    build(column, value as unknown[]);

const pattern =
  (wrap: (value: string) => string): Builder =>
  (column, value) =>
    ilike(column, wrap(escapeLike(String(value))));

const operators: Record<Operator, Builder> = {
  Contains: pattern((value) => `%${value}%`),
  EndsWith: pattern((value) => `%${value}`),
  GT: gt,
  GTE: gte,
  In: list(inArray),
  Is: eq,
  IsNot: ne,
  IsNotNull: isNotNull,
  IsNull: isNull,
  LT: lt,
  LTE: lte,
  NotIn: list(notInArray),
  StartsWith: pattern((value) => `${value}%`),
};

/**
 * Converts a generic Where clause into a Drizzle SQL condition.
 * Returns `undefined` when there is no condition, which Drizzle's `.where()` accepts as "no filter".
 */
export function buildDrizzleWhere<TEntity>(where: Where<TEntity> | undefined, columns: ColumnSource): SQL | undefined {
  const conditions: SQL[] = [];
  const { fields, groups } = splitWhere(where);

  for (const [field, condition] of fields) {
    const column = resolveColumn(columns, field);

    for (const [operator, value] of activeOperators(condition)) {
      conditions.push(operators[operator](column, value));
    }
  }

  const alternatives = groups.map((group) => buildDrizzleWhere(group, columns)).filter((condition): condition is SQL => condition !== undefined);
  if (alternatives.length > 0) {
    conditions.push(or(...alternatives) as SQL);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : (and(...conditions) as SQL);
}
