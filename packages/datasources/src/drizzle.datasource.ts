import type { QueryFilters } from "@ormx/filters";
import { buildDrizzleWhere } from "@ormx/filters/where/drizzle";
import { getTableColumns, type Table } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type IDatasource from "./datasource.interface";
import type { DrizzleTransaction } from "./drizzle.transactor";

type DrizzleDatabase = PostgresJsDatabase | DrizzleTransaction;

export default class DrizzleDatasource<TInferredSchema extends { id: string | number }> implements IDatasource<TInferredSchema, DrizzleDatabase> {
  constructor(
    private readonly database: DrizzleDatabase,
    private readonly table: Table,
  ) {}

  private getColumn(field: string) {
    const columns = getTableColumns(this.table);
    return columns[field as keyof typeof columns];
  }

  withTransaction($transaction: DrizzleDatabase): DrizzleDatasource<TInferredSchema> {
    return new DrizzleDatasource($transaction, this.table);
  }

  async store(payload: Omit<TInferredSchema, "id">): Promise<TInferredSchema> {
    const results = (await this.database.insert(this.table).values(payload).returning()) as TInferredSchema[];

    return results[0];
  }

  async lookup(filters: QueryFilters<TInferredSchema>): Promise<TInferredSchema> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    const [result] = await this.database.select().from(this.table).where(where).limit(1);

    return result as TInferredSchema;
  }

  async list(filters: QueryFilters<TInferredSchema>): Promise<TInferredSchema[]> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    const results = await this.database.select().from(this.table).where(where);

    return results as TInferredSchema[];
  }

  async modify(filters: QueryFilters<TInferredSchema>, payload: Partial<TInferredSchema>): Promise<TInferredSchema> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    const results = (await this.database.update(this.table).set(payload).where(where).returning()) as TInferredSchema[];

    return results[0];
  }

  async destroy(filters: QueryFilters<TInferredSchema>): Promise<void> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    await this.database.delete(this.table).where(where);
  }
}