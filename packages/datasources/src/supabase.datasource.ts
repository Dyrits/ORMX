import type { QueryFilters } from "@ormx/filters";
import { buildSupabaseWhere, type SupabaseFilterBuilder } from "@ormx/filters/where/supabase";
import type IDatasource from "./datasource.interface";

type SupabaseClient = {
  from(table: string): SupabaseFilterBuilder<Record<string, unknown>> & {
    insert(data: unknown): { select(): { single(): Promise<{ data: unknown; error: unknown }> } };
    update(data: unknown): SupabaseFilterBuilder<Record<string, unknown>> & {
      select(): { single(): Promise<{ data: unknown; error: unknown }> };
    };
    delete(): SupabaseFilterBuilder<Record<string, unknown>>;
    select(): SupabaseFilterBuilder<Record<string, unknown>> & {
      limit(count: number): { single(): Promise<{ data: unknown; error: unknown }> };
      then(resolve: (value: { data: unknown[]; error: unknown }) => void): void;
    };
  };
};

export default class SupabaseDatasource<TEntity extends { id: string | number }>
  implements IDatasource<TEntity, SupabaseClient>
{
  private readonly client: SupabaseClient;
  private readonly tableName: string;

  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  withTransaction(_tx: SupabaseClient): never {
    throw new Error(
      "SupabaseDatasource does not support transactions. " +
        "Use DrizzleDatasource with your Supabase Postgres connection URL instead."
    );
  }

  async store(payload: Omit<TEntity, "id">): Promise<TEntity> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as TEntity;
  }

  async lookup(filters: QueryFilters<TEntity>): Promise<TEntity> {
    let query = this.client.from(this.tableName).select();
    query = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where) as typeof query;

    const { data, error } = await query.limit(1).single();

    if (error) {
      throw error;
    }

    return data as TEntity;
  }

  async list(filters: QueryFilters<TEntity>): Promise<TEntity[]> {
    let query = this.client.from(this.tableName).select();
    query = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where) as typeof query;

    const result = await new Promise<{ data: unknown[]; error: unknown }>((resolve) => {
      query.then(resolve);
    });

    if (result.error) {
      throw result.error;
    }

    return result.data as TEntity[];
  }

  async modify(filters: QueryFilters<TEntity>, payload: Partial<TEntity>): Promise<TEntity> {
    let query = this.client.from(this.tableName).update(payload);
    query = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where) as typeof query;

    const { data, error } = await query.select().single();

    if (error) {
      throw error;
    }

    return data as TEntity;
  }

  async destroy(filters: QueryFilters<TEntity>): Promise<void> {
    let query = this.client.from(this.tableName).delete();
    query = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where) as typeof query;

    const result = await new Promise<{ error: unknown }>((resolve) => {
      (query as unknown as { then(resolve: (value: { error: unknown }) => void): void }).then(resolve);
    });

    if (result.error) {
      throw result.error;
    }
  }
}
