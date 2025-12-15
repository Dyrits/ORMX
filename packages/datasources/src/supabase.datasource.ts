import type { QueryFilters } from "@ormx/filters";
import { buildSupabaseWhere, type SupabaseFilterBuilder } from "@ormx/filters/where/supabase";
import type IDatasource from "./datasource.interface";

/**
 * Minimal Supabase client interface for datasource operations.
 * Compatible with `@supabase/supabase-js` SupabaseClient.
 */
export interface SupabaseClientLike {
  from(table: string): SupabaseFilterBuilder<Record<string, unknown>> & {
    insert(data: unknown): { select(): { single(): PromiseLike<{ data: unknown; error: unknown }> } };
    update(data: unknown): SupabaseFilterBuilder<Record<string, unknown>> & {
      select(): { single(): PromiseLike<{ data: unknown; error: unknown }> };
    };
    delete(): SupabaseFilterBuilder<Record<string, unknown>> & PromiseLike<{ error: unknown }>;
    select(): SupabaseFilterBuilder<Record<string, unknown>> & {
      limit(count: number): { single(): PromiseLike<{ data: unknown; error: unknown }> };
    } & PromiseLike<{ data: unknown[]; error: unknown }>;
  };
}

export default class SupabaseDatasource<TEntity extends { id: string | number }> implements IDatasource<TEntity, SupabaseClientLike> {
  constructor(
    private readonly client: SupabaseClientLike,
    private readonly table: string,
  ) {}

  withTransaction(_$transaction: SupabaseClientLike): never {
    throw new Error("SupabaseDatasource does not support transactions.Use DrizzleDatasource with your Supabase Postgres connection URL instead.");
  }

  async store(payload: Omit<TEntity, "id">): Promise<TEntity> {
    const { data, error } = await this.client.from(this.table).insert(payload).select().single();

    if (error) {
      throw error;
    }

    return data as TEntity;
  }

  async lookup(filters: QueryFilters<TEntity>): Promise<TEntity> {
    const query = this.client.from(this.table).select();
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where);

    const { data, error } = await (filtered as typeof query).limit(1).single();

    if (error) {
      throw error;
    }

    return data as TEntity;
  }

  async list(filters: QueryFilters<TEntity>): Promise<TEntity[]> {
    const query = this.client.from(this.table).select();
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where);

    const { data, error } = await (filtered as typeof query);

    if (error) {
      throw error;
    }

    return (data ?? []) as TEntity[];
  }

  async modify(filters: QueryFilters<TEntity>, payload: Partial<TEntity>): Promise<TEntity> {
    const query = this.client.from(this.table).update(payload);
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where);

    const { data, error } = await (filtered as typeof query).select().single();

    if (error) {
      throw error;
    }

    return data as TEntity;
  }

  async destroy(filters: QueryFilters<TEntity>): Promise<void> {
    const query = this.client.from(this.table).delete();
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TEntity>, filters.where);

    const { error } = await (filtered as typeof query);

    if (error) {
      throw error;
    }
  }
}
