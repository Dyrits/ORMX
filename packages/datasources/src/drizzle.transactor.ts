import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type ITransactor from "./transactor.interface";

export type DrizzleTransaction = PgTransaction<PgQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

export default class DrizzleTransactor implements ITransactor<DrizzleTransaction> {
  constructor(private readonly database: PostgresJsDatabase) {}

  async transact<TResult>(callback: (transaction: DrizzleTransaction) => Promise<TResult>): Promise<TResult> {
    return this.database.transaction(async ($transaction) => {
      return callback($transaction);
    }) as Promise<TResult>;
  }
}
