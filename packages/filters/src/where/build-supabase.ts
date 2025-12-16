import type { Operator, Where } from "../types";

/**
 * Supabase/PostgREST filter builder interface.
 * Compatible with the query builder returned by `supabase.from('table').select()`.
 */
export type SupabaseFilterBuilder<TSelect> = {
  eq(column: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  neq(column: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  gt(column: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  gte(column: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  lt(column: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  lte(column: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  in(column: string, values: unknown[]): SupabaseFilterBuilder<TSelect>;
  ilike(column: string, pattern: string): SupabaseFilterBuilder<TSelect>;
  is(column: string, value: null): SupabaseFilterBuilder<TSelect>;
  not(column: string, operator: string, value: unknown): SupabaseFilterBuilder<TSelect>;
  or(filters: string): SupabaseFilterBuilder<TSelect>;
  filter(column: string, operator: string, value: unknown): SupabaseFilterBuilder<TSelect>;
};

const operators: Record<Operator, { method: string; transform?: (value: unknown) => unknown } | null> = {
  Contains: { method: "ilike", transform: (value) => `%${String(value)}%` },
  EndsWith: { method: "ilike", transform: (value) => `%${String(value)}` },
  GT: { method: "gt" },
  GTE: { method: "gte" },
  In: { method: "in" },
  Is: { method: "eq" },
  IsNot: { method: "neq" },
  IsNotNull: null,
  IsNull: null,
  LT: { method: "lt" },
  LTE: { method: "lte" },
  NotIn: null,
  StartsWith: { method: "ilike", transform: (value) => `${String(value)}%` },
};

function buildConditionString<TSelect, FieldKey extends keyof TSelect>(
  field: FieldKey,
  operator: Operator,
  $value: TSelect[FieldKey] | TSelect[FieldKey][] | null,
): string | null {
  if (operator === "IsNull") {
    return `${String(field)}.is.null`;
  }

  if (operator === "IsNotNull") {
    return `${String(field)}.not.is.null`;
  }

  if (operator === "NotIn") {
    if (Array.isArray($value)) {
      return `${String(field)}.not.in.(${($value as unknown[]).join(",")})`;
    }
    return null;
  }

  if ($value == null) {
    return null;
  }

  const $operator = operators[operator];
  if (!$operator) {
    return null;
  }

  const finalValue = $operator.transform ? $operator.transform($value) : $value;

  if ($operator.method === "in" && Array.isArray(finalValue)) {
    return `${String(field)}.in.(${(finalValue as unknown[]).join(",")})`;
  }

  return `${String(field)}.${$operator.method}.${finalValue}`;
}

function buildWhereStrings<TSelect>(where: Where<TSelect>): string[] {
  const output: string[] = [];

  for (const [key, value] of Object.entries(where) as [keyof Where<TSelect>, Where<TSelect>[keyof Where<TSelect>]][]) {
    if (key === "OneOf") {
      continue;
    }

    if (!value) {
      continue;
    }

    type FieldKey = keyof TSelect;
    const field = key as FieldKey;
    const condition = value as Partial<Record<Operator, TSelect[FieldKey] | TSelect[FieldKey][] | null>>;

    for (const [operator, $value] of Object.entries(condition) as [Operator, TSelect[FieldKey] | TSelect[FieldKey][] | null][]) {
      const result = buildConditionString(field, operator, $value);
      if (result) {
        output.push(result);
      }
    }
  }

  return output;
}

/**
 * Applies Where filters to a Supabase query builder.
 */
export function buildSupabaseWhere<TSelect>(query: SupabaseFilterBuilder<TSelect>, where?: Where<TSelect>): SupabaseFilterBuilder<TSelect> {
  if (!where) {
    return query;
  }

  for (const [key, value] of Object.entries(where) as [keyof Where<TSelect>, Where<TSelect>[keyof Where<TSelect>]][]) {
    if (key === "OneOf") {
      if (Array.isArray(value)) {
        const groups = value as Where<TSelect>[];
        if (groups.length > 0) {
          const $or = groups
            .map(($where) => {
              const conditions = buildWhereStrings($where);
              if (conditions.length === 0) {
                return null;
              }
              if (conditions.length === 1) {
                return conditions[0];
              }
              return `and(${conditions.join(",")})`;
            })
            .filter((condition): condition is string => condition !== null)
            .join(",");

          if ($or) {
            query = query.or($or);
          }
        }
      }
      continue;
    }

    if (!value) {
      continue;
    }

    type FieldKey = keyof TSelect;
    const field = key as FieldKey;
    const condition = value as Partial<Record<Operator, TSelect[FieldKey] | TSelect[FieldKey][] | null>>;

    for (const [operator, $value] of Object.entries(condition) as [Operator, TSelect[FieldKey] | TSelect[FieldKey][] | null][]) {
      if (operator === "IsNull") {
        query = query.is(field as string, null);
        continue;
      }

      if (operator === "IsNotNull") {
        query = query.not(field as string, "is", null);
        continue;
      }

      if (operator === "NotIn") {
        if (Array.isArray($value)) {
          query = query.not(field as string, "in", `(${($value as unknown[]).join(",")})`);
        }
        continue;
      }

      if ($value == null) {
        continue;
      }

      const $operator = operators[operator];
      if (!$operator) {
        continue;
      }

      const finalValue = $operator.transform ? $operator.transform($value) : $value;
      query = query.filter(field as string, $operator.method, finalValue);
    }
  }

  return query;
}
