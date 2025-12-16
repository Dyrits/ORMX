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

export default class SupabaseDatasource<TSelect, TInsert extends Record<string, unknown>> implements IDatasource<TSelect, TInsert, SupabaseClientLike> {
  constructor(
    private readonly client: SupabaseClientLike,
    private readonly table: string,
  ) {}

  withTransaction(_$transaction: SupabaseClientLike): never {
    throw new Error("SupabaseDatasource does not support transactions.Use DrizzleDatasource with your Supabase Postgres connection URL instead.");
  }

  async store(payload: TInsert): Promise<TSelect> {
    const { data, error } = await this.client.from(this.table).insert(payload).select().single();

    if (error) {
      throw error;
    }

    return data as TSelect;
  }

  async lookup(filters: QueryFilters<TSelect>): Promise<TSelect> {
    const query = this.client.from(this.table).select();
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TSelect>, filters.where);

    const { data, error } = await (filtered as typeof query).limit(1).single();

    if (error) {
      throw error;
    }

    return data as TSelect;
  }

  async list(filters: QueryFilters<TSelect>): Promise<TSelect[]> {
    const query = this.client.from(this.table).select();
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TSelect>, filters.where);

    const { data, error } = await (filtered as typeof query);

    if (error) {
      throw error;
    }

    return (data ?? []) as TSelect[];
  }

  async modify(filters: QueryFilters<TSelect>, payload: Partial<TInsert>): Promise<TSelect> {
    const query = this.client.from(this.table).update(payload);
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TSelect>, filters.where);

    const { data, error } = await (filtered as typeof query).select().single();

    if (error) {
      throw error;
    }

    return data as TSelect;
  }

  async destroy(filters: QueryFilters<TSelect>): Promise<void> {
    const query = this.client.from(this.table).delete();
    const filtered = buildSupabaseWhere(query as SupabaseFilterBuilder<TSelect>, filters.where);

    const { error } = await (filtered as typeof query);

    if (error) {
      throw error;
    }
  }
}
