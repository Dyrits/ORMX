import type { QueryFilters } from "@ormx/filters";
import { buildDrizzleWhere } from "@ormx/filters/where/drizzle";
import { getTableColumns, type Table } from "drizzle-orm";
import type { PostgresJsDatabase, PostgresJsTransaction } from "drizzle-orm/postgres-js";
import type IDatasource from "./datasource.interface";

type DrizzleDatabase = PostgresJsDatabase | PostgresJsTransaction<Record<string, never>, Record<string, never>>;

export default class DrizzleDatasource<TEntity extends { id: string | number }, TTable extends Table> implements IDatasource<TEntity, DrizzleDatabase> {
  constructor(private readonly database: DrizzleDatabase, private readonly table: TTable) {}

  private getColumn(field: string) {
    const columns = getTableColumns(this.table);
    return columns[field as keyof typeof columns];
  }

  withTransaction($transaction: DrizzleDatabase): DrizzleDatasource<TEntity, TTable> {
    return new DrizzleDatasource($transaction, this.table);
  }

  async store(payload: Omit<TEntity, "id">): Promise<TEntity> {
    const results = (await this.database
      .insert(this.table as never)
      .values(payload as never)
      .returning()) as TEntity[];

    return results[0];
  }

  async lookup(filters: QueryFilters<TEntity>): Promise<TEntity> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    const [result] = await this.database
      .select()
      .from(this.table as never)
      .where(where)
      .limit(1);

    return result as TEntity;
  }

  async list(filters: QueryFilters<TEntity>): Promise<TEntity[]> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    const results = await this.database
      .select()
      .from(this.table as never)
      .where(where);

    return results as TEntity[];
  }

  async modify(filters: QueryFilters<TEntity>, payload: Partial<TEntity>): Promise<TEntity> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    const results = (await this.database
      .update(this.table as never)
      .set(payload as never)
      .where(where)
      .returning()) as TEntity[];

    return results[0];
  }

  async destroy(filters: QueryFilters<TEntity>): Promise<void> {
    const where = buildDrizzleWhere(filters.where, (field) => this.getColumn(field));

    await this.database.delete(this.table as never).where(where);
  }
}
