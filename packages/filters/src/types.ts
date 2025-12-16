/**
 * Available filter operators for query conditions.
 */
export type Operator = "Is" | "IsNot" | "GT" | "GTE" | "LT" | "LTE" | "In" | "NotIn" | "Contains" | "StartsWith" | "EndsWith" | "IsNull" | "IsNotNull";

/**
 * Where clause for filtering entities.
 * Each field can have one or more operators applied.
 * Use `OneOf` for OR logic between multiple conditions.
 *
 * @example
 * ```ts
 * const where: Where<User> = {
 *   name: { Contains: "john" },
 *   age: { GTE: 18, LTE: 65 },
 *   OneOf: [
 *     { status: { Is: "active" } },
 *     { role: { Is: "admin" } }
 *   ]
 * };
 * ```
 */
export type Where<TSelect> = Partial<{
  [Key in keyof TSelect]?: Partial<Record<Operator, TSelect[Key] | TSelect[Key][] | null>>;
}> & { OneOf?: Where<TSelect>[] };

/**
 * Select clause for choosing which fields to include.
 */
export type Select<TSelect> = Partial<{
  [Key in keyof TSelect]?: {
    include: boolean;
    fields?: {
      with?: Array<keyof TSelect[Key]>;
      without?: Array<keyof TSelect[Key]>;
    };
    select?: Select<TSelect[Key]>;
    where?: Where<TSelect[Key]>;
  };
}>;

/**
 * Order direction for sorting.
 */
export type OrderDirection = "asc" | "desc";

/**
 * Order clause for sorting entities.
 */
export type Order<TSelect> = Partial<{
  [Key in keyof TSelect]?: OrderDirection;
}>;

/**
 * Complete query filters including where, select, and order clauses.
 */
export type QueryFilters<TSelect> = {
  where?: Where<TSelect>;
  select?: Select<TSelect>;
  order?: Order<TSelect>;
};
