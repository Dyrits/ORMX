import { type EntityMetadata, ReferenceKind } from "@mikro-orm/core";
import { isNestedSelect, selectedEntries } from "../shared.js";
import type { Select } from "../types.js";
import { buildMikroOrmOrder } from "./order.js";
import { buildMikroOrmWhere } from "./where.js";

/**
 * Conditions and ordering scoped to selected relations, as accepted by MikroORM's `populateWhere` and `populateOrderBy`.
 */
export type MikroOrmPopulateFilters = {
  populateWhere?: Record<string, unknown>;
  populateOrderBy?: Record<string, unknown>;
};

function isRelation(metadata: EntityMetadata | undefined, field: string): boolean {
  const kind = metadata?.properties[field]?.kind;

  return kind !== undefined && kind !== ReferenceKind.SCALAR && kind !== ReferenceKind.EMBEDDED;
}

function collectFields(select: object | undefined, metadata: EntityMetadata | undefined, prefix: string): string[] {
  return selectedEntries(select).flatMap(([field, value]) => {
    const path = `${prefix}${field}`;

    if (isNestedSelect(value)) {
      const nested = collectFields(value.select, metadata?.properties[field]?.targetMeta, `${path}.`);
      return nested.length > 0 ? nested : [`${path}.*`];
    }

    return isRelation(metadata, field) ? [`${path}.*`] : [path];
  });
}

/**
 * Converts a generic Select clause into MikroORM partial loading `fields`, as dotted paths that also populate the selected relations.
 * Pass the entity metadata, from `em.getMetadata().find(entity)`, so that a relation selected with `true` loads all of its fields; without it, only its primary key is loaded.
 * MikroORM always loads primary keys, even when they are not selected.
 * Returns `undefined` when no field is selected, meaning all fields.
 */
export function buildMikroOrmSelect<TEntity>(select?: Select<TEntity>, metadata?: EntityMetadata): string[] | undefined {
  const output = collectFields(select, metadata, "");

  return output.length > 0 ? output : undefined;
}

function collectPopulateFilters(select: object | undefined, path: string[]): MikroOrmPopulateFilters {
  const populateWhere: Record<string, unknown> = {};
  const populateOrderBy: Record<string, unknown> = {};

  for (const [field, value] of selectedEntries(select)) {
    if (!isNestedSelect(value)) {
      continue;
    }

    const current = [...path, field];

    if (value.limit !== undefined || value.offset !== undefined) {
      throw new Error(`[@ormx/filters] MikroORM does not support pagination scoped to relation "${current.join(".")}".`);
    }

    const where = buildMikroOrmWhere(value.where) as Record<string, unknown>;
    if (Object.keys(where).length > 0) {
      if (path.length > 0) {
        throw new Error(`[@ormx/filters] MikroORM only supports filters scoped to a top-level relation, not "${current.join(".")}".`);
      }
      populateWhere[field] = where;
    }

    const nested = collectPopulateFilters(value.select, current);
    const order = { ...buildMikroOrmOrder(value.order), ...nested.populateOrderBy };
    if (Object.keys(order).length > 0) {
      populateOrderBy[field] = order;
    }
  }

  return {
    ...(Object.keys(populateWhere).length > 0 && { populateWhere }),
    ...(Object.keys(populateOrderBy).length > 0 && { populateOrderBy }),
  };
}

/**
 * Converts the filters of nested selections into MikroORM `populateWhere` and `populateOrderBy`, which apply to the loaded relations without filtering the root entities.
 * Relation-scoped filters are only supported on top-level relations, since MikroORM would otherwise drop intermediate items without a match. Relation-scoped pagination throws.
 */
export function buildMikroOrmPopulateFilters<TEntity>(select?: Select<TEntity>): MikroOrmPopulateFilters {
  return collectPopulateFilters(select, []);
}
