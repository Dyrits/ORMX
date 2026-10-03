import { type EntityData, type EntityName, type FindOptions, type RequiredEntityData, wrap } from "@mikro-orm/core";
import type { SqlEntityManager } from "@mikro-orm/sql";
import type { QueryFilters, ScalarSelect } from "@ormx/filters";
import { buildMikroOrmFilters, buildMikroOrmWhere } from "@ormx/filters/mikro-orm";
import type IDatasource from "./datasource.interface.js";
import type { WriteFilters } from "./datasource.interface.js";
import { assertFiltered, first } from "./guards.js";

function returning<TEntity>(select?: ScalarSelect<TEntity>): string[] {
  const fields = Object.entries(select ?? {}).flatMap(([field, selected]) => (selected ? [field] : []));
  return fields.length > 0 ? fields : ["*"];
}

/**
 * Datasource backed by a MikroORM SQL entity manager.
 * Reads return plain objects rather than managed entities, and leave the identity map of the entity manager untouched.
 * `store` goes through the unit of work, so `onCreate` and lifecycle hooks run. `modify` and `destroy` run as single native queries, which skip them.
 */
export default class MikroOrmDatasource<TEntity extends object, TSelect = TEntity, TInsert extends object = RequiredEntityData<TEntity>>
  implements IDatasource<TSelect, TInsert, SqlEntityManager>
{
  constructor(
    private readonly em: SqlEntityManager,
    private readonly entity: EntityName<TEntity>,
  ) {}

  withTransaction(transaction: SqlEntityManager): MikroOrmDatasource<TEntity, TSelect, TInsert> {
    return new MikroOrmDatasource<TEntity, TSelect, TInsert>(transaction, this.entity);
  }

  async store(payload: TInsert): Promise<TSelect> {
    const em = this.em.fork({ keepTransactionContext: true });
    const entity = em.create(this.entity, payload as unknown as RequiredEntityData<TEntity>);

    await em.flush();

    // Read the row back in isolation, so it holds database-side values such as `null` for unset nullable columns, and the shape `list` returns.
    const row = await em.findOneOrFail(this.entity, entity as never, { disableIdentityMap: true });

    return wrap(row).toObject() as TSelect;
  }

  async lookup(filters: QueryFilters<TSelect> = {}): Promise<TSelect | null> {
    return first(await this.list({ ...filters, limit: 1 }));
  }

  async list(filters: QueryFilters<TSelect> = {}): Promise<TSelect[]> {
    const { options, where } = buildMikroOrmFilters(filters, this.em.getMetadata().find(this.entity));
    const rows = await this.em.find(this.entity, where as never, { ...(options as FindOptions<TEntity>), disableIdentityMap: true });

    return rows.map((row) => wrap(row).toObject() as TSelect);
  }

  async modify(filters: WriteFilters<TSelect>, payload: Partial<TInsert>): Promise<TSelect[]> {
    const where = buildMikroOrmWhere(filters.where);
    assertFiltered(where, "modify");

    return await this.em
      .createQueryBuilder(this.entity)
      .update(payload as unknown as EntityData<TEntity>)
      .where(where as never)
      .returning(returning(filters.select) as never)
      .execute<TSelect[]>("all", true);
  }

  async destroy(filters: WriteFilters<TSelect>): Promise<void> {
    const where = buildMikroOrmWhere(filters.where);
    assertFiltered(where, "destroy");

    await this.em.nativeDelete(this.entity, where as never);
  }
}
