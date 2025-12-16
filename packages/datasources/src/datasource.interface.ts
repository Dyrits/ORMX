import type { QueryFilters } from "@ormx/filters";

export default interface IDatasource<TSelect, TInsert extends Record<string, unknown>, TTransaction> {
  store(payload: TInsert): Promise<TSelect>;
  lookup(filters: QueryFilters<TSelect>): Promise<TSelect>;
  list(filters: QueryFilters<TSelect>): Promise<TSelect[]>;
  modify(filters: QueryFilters<TSelect>, payload: Partial<TInsert>): Promise<TSelect>;
  destroy(filters: QueryFilters<TSelect>): Promise<void>;
  withTransaction(transaction: TTransaction): IDatasource<TSelect, TInsert, TTransaction>;
}
