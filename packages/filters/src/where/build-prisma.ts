import type { Operator, Where } from "../types";

const operators: Record<Operator, keyof PrismaFieldOperators<unknown> | null> = {
  Contains: "contains",
  EndsWith: "endsWith",
  GT: "gt",
  GTE: "gte",
  In: "in",
  Is: "equals",
  IsNot: "not",
  IsNotNull: null,
  IsNull: null,
  LT: "lt",
  LTE: "lte",
  NotIn: "notIn",
  StartsWith: "startsWith",
};

/**
 * Shape of Prisma's per-field filter operators.
 */
export type PrismaFieldOperators<Value> = {
  equals?: Value | null;
  gt?: Value;
  gte?: Value;
  lt?: Value;
  lte?: Value;
  in?: Value[];
  notIn?: Value[];
  not?: Value | PrismaFieldOperators<Value>;
  contains?: Value;
  startsWith?: Value;
  endsWith?: Value;
};

/**
 * Prisma's full `where` type for an entity.
 */
export type PrismaWhere<TEntity> = { [Key in keyof TEntity]?: PrismaFieldOperators<TEntity[Key]> } & {
  AND?: PrismaWhere<TEntity>[];
  OR?: PrismaWhere<TEntity>[];
  NOT?: PrismaWhere<TEntity>[];
};

/**
 * Converts a generic Where clause into Prisma-compatible format.
 */
export function buildPrismaWhere<TEntity>(where?: Where<TEntity>): PrismaWhere<TEntity> {
  const output = {} as PrismaWhere<TEntity>;

  if (!where) {
    return output;
  }

  for (const [key, value] of Object.entries(where) as [keyof Where<TEntity>, Where<TEntity>[keyof Where<TEntity>]][]) {
    if (key === "OneOf") {
      if (Array.isArray(value)) {
        const groups = value as Where<TEntity>[];
        const or = groups.map(($where) => buildPrismaWhere($where));

        if (or.length > 0) {
          output.OR = or;
        }
      }
      continue;
    }

    if (!value) {
      continue;
    }

    type FieldKey = keyof TEntity;
    const field = key as FieldKey;
    const condition = value as Partial<Record<Operator, TEntity[FieldKey] | TEntity[FieldKey][] | null>>;

    const prisma$operators: PrismaFieldOperators<TEntity[FieldKey]> = {};

    for (const [operator, $value] of Object.entries(condition) as [Operator, TEntity[FieldKey] | TEntity[FieldKey][] | null][]) {
      if (operator === "IsNull") {
        prisma$operators.equals = null;
        continue;
      }

      if (operator === "IsNotNull") {
        (prisma$operators as { not: null }).not = null;
        continue;
      }

      const $operator = operators[operator];
      if (!$operator) {
        continue;
      }

      (prisma$operators as Record<keyof PrismaFieldOperators<TEntity[FieldKey]>, unknown>)[$operator] = $value;
    }

    if (Object.keys(prisma$operators).length > 0) {
      (output as Record<FieldKey, PrismaFieldOperators<TEntity[FieldKey]>>)[field] = prisma$operators;
    }
  }

  return output;
}
