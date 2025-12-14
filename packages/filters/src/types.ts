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
export type Where<TEntity> = Partial<{
  [Key in keyof TEntity]?: Partial<Record<Operator, TEntity[Key] | TEntity[Key][] | null>>;
}> & { OneOf?: Where<TEntity>[] };

/**
 * Select clause for choosing which fields to include.
 */
export type Select<TEntity> = Partial<{
  [Key in keyof TEntity]?: {
    include: boolean;
    fields?: {
      with?: Array<keyof TEntity[Key]>;
      without?: Array<keyof TEntity[Key]>;
    };
    select?: Select<TEntity[Key]>;
    where?: Where<TEntity[Key]>;
  };
}>;

/**
 * Order direction for sorting.
 */
export type OrderDirection = "asc" | "desc";

/**
 * Order clause for sorting entities.
 */
export type Order<TEntity> = Partial<{
  [Key in keyof TEntity]?: OrderDirection;
}>;

/**
 * Complete query filters including where, select, and order clauses.
 */
export type QueryFilters<TEntity> = {
  where?: Where<TEntity>;
  select?: Select<TEntity>;
  order?: Order<TEntity>;
};
