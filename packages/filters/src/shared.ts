import type { FieldOperators, Operator, QueryFilters, Where } from "./types.js";

/**
 * Every supported operator, used to reject unknown ones coming from untrusted input.
 */
export const OPERATORS: readonly Operator[] = [
  "Is",
  "IsNot",
  "GT",
  "GTE",
  "LT",
  "LTE",
  "In",
  "NotIn",
  "Contains",
  "StartsWith",
  "EndsWith",
  "IsNull",
  "IsNotNull",
];

const known = new Set<string>(OPERATORS);

export type FieldCondition = [field: string, condition: FieldOperators<unknown>];

/**
 * Splits a where clause into its field conditions and its OneOf groups, skipping empty entries.
 */
export function splitWhere<TEntity>(where: Where<TEntity> | undefined): { fields: FieldCondition[]; groups: Where<TEntity>[] } {
  if (!where) {
    return { fields: [], groups: [] };
  }

  const { OneOf, ...rest } = where;
  const fields = Object.entries(rest).filter((entry): entry is FieldCondition => Boolean(entry[1]));

  return { fields, groups: OneOf ?? [] };
}

const listOperators = new Set<Operator>(["In", "NotIn"]);
const flagOperators = new Set<Operator>(["IsNull", "IsNotNull"]);

/**
 * Whether an operator applies with the given value.
 * Blank values, lists that are not arrays and flags set to `false` are skipped, so optional inputs can be passed through as they are.
 * Flags are enabled by anything but `false` and `undefined`, so JSON payloads using `null` keep working.
 */
function isActive(operator: Operator, value: unknown): boolean {
  if (flagOperators.has(operator)) {
    return value !== false && value !== undefined;
  }

  if (listOperators.has(operator)) {
    return Array.isArray(value);
  }

  return value !== undefined && value !== null;
}

/**
 * Lists the operators of a field condition that apply, with their values.
 * Throws on unknown operators, so a typo or a bad payload cannot silently drop a condition.
 */
export function activeOperators(condition: FieldOperators<unknown>): [Operator, unknown][] {
  const entries = Object.entries(condition);

  for (const [operator] of entries) {
    if (!known.has(operator)) {
      throw new Error(`[@ormx/filters] Unknown operator "${operator}".`);
    }
  }

  return (entries as [Operator, unknown][]).filter(([operator, value]) => isActive(operator, value));
}

/**
 * Lists the entries of a select or order clause that are switched on, skipping `false` and `undefined` values.
 * `TValue` names what the clause holds once those are skipped, such as `OrderDirection` for an order clause.
 */
export function enabledEntries<TValue>(clause: object | undefined): [field: string, value: TValue][] {
  if (!clause) {
    return [];
  }

  return Object.entries(clause).filter((entry): entry is [string, TValue] => Boolean(entry[1]));
}

/**
 * Lists the entries of a select clause that are switched on: `true` for a field, or nested query filters for a relation.
 */
export function selectedEntries(select: object | undefined): [field: string, value: true | QueryFilters<unknown>][] {
  return enabledEntries<true | QueryFilters<unknown>>(select);
}

/**
 * Whether a select entry is a nested query on a relation.
 */
export function isNestedSelect(value: unknown): value is QueryFilters<unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Escapes LIKE wildcards so that user input is matched literally.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
