import type { QueryFilters } from "@ormx/filters";

export default interface IDatasource<TEntity extends { id: string | number }, TTransaction = unknown> {
  store(payload: Omit<TEntity, "id">): Promise<TEntity>;
  lookup(filters: QueryFilters<TEntity>): Promise<TEntity>;
  list(filters: QueryFilters<TEntity>): Promise<TEntity[]>;
  modify(filters: QueryFilters<TEntity>, payload: Partial<TEntity>): Promise<TEntity>;
  destroy(filters: QueryFilters<TEntity>): Promise<void>;
  withTransaction(tx: TTransaction): IDatasource<TEntity, TTransaction>;
}
