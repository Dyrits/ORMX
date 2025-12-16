import type { QueryFilters } from "@ormx/filters";
import { buildDrizzleWhere } from "@ormx/filters/where/drizzle";
import { getTableColumns, type Table } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type IDatasource from "./datasource.interface";
import type { DrizzleTransaction } from "./drizzle.transactor";

type DrizzleDatabase = PostgresJsDatabase | DrizzleTransaction;

export default class DrizzleDatasource<TSelect, TInsert extends Record<string, unknown>> implements IDatasource<TSelect, TInsert, DrizzleDatabase> {
  constructor(
    private readonly database: DrizzleDatabase,
    private readonly table: Table,
  ) {}

  private getColumn(field: string) {
    const columns = getTableColumns(this.table);
    return columns[field as keyof typeof columns];
  }

  withTransaction($transaction: DrizzleDatabase): DrizzleDatasource<TSelect, TInsert> {
    return new DrizzleDatasource($transaction, this.table);
  }

  async store(payload: TInsert): Promise<TSelect> {
    const results = (await this.database.insert(this.table).values(payload).returning()) as TSelect[];

    return results[0];
  }

  async lookup(filters: QueryFilters<TSelect>): Promise<TSelect> {
    const where = buildDrizzleWhere(filters.where || {}, (field) => this.getColumn(field));

    const [result] = await this.database.select().from(this.table).where(where).limit(1);

    return result as TSelect;
  }

  async list(filters: QueryFilters<TSelect>): Promise<TSelect[]> {
    const where = buildDrizzleWhere(filters.where || {}, (field) => this.getColumn(field));

    const results = await this.database.select().from(this.table).where(where);

    return results as TSelect[];
  }

  async modify(filters: QueryFilters<TSelect>, payload: Partial<TInsert>): Promise<TSelect> {
    const where = buildDrizzleWhere(filters.where || {}, (field) => this.getColumn(field));

    const results = (await this.database.update(this.table).set(payload).where(where).returning()) as TSelect[];

    return results[0];
  }

  async destroy(filters: QueryFilters<TSelect>): Promise<void> {
    const where = buildDrizzleWhere(filters.where || {}, (field) => this.getColumn(field));

    await this.database.delete(this.table).where(where);
  }
}
