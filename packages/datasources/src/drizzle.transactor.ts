import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type ITransactor from "./transactor.interface";

type TransactionCallback<TResult> = Parameters<PostgresJsDatabase["transaction"]>[0];
type DrizzleTransaction = Parameters<TransactionCallback<unknown>>[0];

export default class DrizzleTransactor implements ITransactor<DrizzleTransaction> {
  constructor(private readonly database: PostgresJsDatabase) {}

  async transact<TResult>(callback: (transaction: DrizzleTransaction) => Promise<TResult>): Promise<TResult> {
    return this.database.transaction(async ($transaction) => {
      return callback($transaction);
    }) as Promise<TResult>;
  }
}
