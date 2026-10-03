import type { SqlEntityManager } from "@mikro-orm/sql";
import type ITransactor from "./transactor.interface.js";

/** Runs callbacks using MikroORM's transaction-scoped entity manager. */
export default class MikroOrmTransactor implements ITransactor<SqlEntityManager> {
  constructor(private readonly em: SqlEntityManager) {}

  transact<TResult>(callback: (transaction: SqlEntityManager) => Promise<TResult>): Promise<TResult> {
    return this.em.transactional(callback);
  }
}
