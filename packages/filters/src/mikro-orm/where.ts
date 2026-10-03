import type { FilterQuery } from "@mikro-orm/core";
import { activeOperators, escapeLike, splitWhere } from "../shared.js";
import type { FieldOperators, Operator, Where } from "../types.js";

/**
 * MikroORM operator map for a single field, such as `{ $gte: 18, $lte: 65 }`.
 */
type Fragment = Record<string, unknown>;
type Builder = (value: unknown) => Fragment;

const comparison =
  (key: string): Builder =>
  (value) => ({ [key]: value });

const flag =
  (fragment: Fragment): Builder =>
  () =>
    fragment;

const pattern =
  (wrap: (value: string) => string): Builder =>
  (value) => ({ $ilike: wrap(escapeLike(String(value))) });

const operators: Record<Operator, Builder> = {
  Contains: pattern((value) => `%${value}%`),
  EndsWith: pattern((value) => `%${value}`),
  GT: comparison("$gt"),
  GTE: comparison("$gte"),
  In: comparison("$in"),
  Is: comparison("$eq"),
  IsNot: comparison("$ne"),
  IsNotNull: flag({ $ne: null }),
  IsNull: flag({ $eq: null }),
  LT: comparison("$lt"),
  LTE: comparison("$lte"),
  NotIn: comparison("$nin"),
  StartsWith: pattern((value) => `${value}%`),
};

/**
 * Splits the operators of a field into operator maps whose keys do not collide.
 * Several text operators all map to `$ilike`, and `IsNull` shares `$eq` with `Is`, so a colliding operator starts a new map rather than overwriting the previous one.
 */
function buildField(condition: FieldOperators<unknown>): Fragment[] {
  const output: Fragment[] = [];

  for (const [operator, value] of activeOperators(condition)) {
    const fragment = operators[operator](value);
    const target = output.find((current) => Object.keys(fragment).every((key) => !(key in current)));

    if (target) {
      Object.assign(target, fragment);
    } else {
      output.push({ ...fragment });
    }
  }

  return output;
}

/**
 * Converts a generic Where clause into a MikroORM filter query.
 * Fields with colliding operators are completed through `$and`, and `OneOf` groups become `$or`. Text operators use `$ilike`, which MikroORM only supports on PostgreSQL.
 * Returns an empty object when there is no condition, which MikroORM reads as "no filter".
 */
export function buildMikroOrmWhere<TEntity>(where?: Where<TEntity>): FilterQuery<TEntity> {
  const output: Record<string, unknown> = {};
  const and: Fragment[] = [];
  const { fields, groups } = splitWhere(where);

  for (const [field, condition] of fields) {
    const [first, ...rest] = buildField(condition);

    if (first) {
      output[field] = first;
      and.push(...rest.map((fragment) => ({ [field]: fragment })));
    }
  }

  if (and.length > 0) {
    output.$and = and;
  }

  const alternatives = groups.map((group) => buildMikroOrmWhere(group)).filter((group) => Object.keys(group).length > 0);
  if (alternatives.length > 0) {
    output.$or = alternatives;
  }

  return output as FilterQuery<TEntity>;
}
