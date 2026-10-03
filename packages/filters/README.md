# @ormx/filters

Unified query filtering across Prisma, Drizzle, TypeORM, MikroORM, and Supabase.

Write your filters once using a common format, then convert them to the native format of your ORM or database client. Where, select, order and pagination are all covered.

## Installation

```bash
npm install @ormx/filters
# or
bun add @ormx/filters
```

Drizzle support needs `drizzle-orm` installed, TypeORM support needs TypeORM 1.0 or later, and MikroORM support needs `@mikro-orm/core` 7.0 or later. Prisma and Supabase support have no extra dependency.

Import from a sub-path to keep the other targets out of your bundle. The root export pulls in all five, so it requires the optional ORM peers to be installed:

```typescript
import { buildPrismaFilters } from "@ormx/filters/prisma";
import { buildDrizzleFilters } from "@ormx/filters/drizzle";
import { buildMikroOrmFilters } from "@ormx/filters/mikro-orm";
import { buildSupabaseFilters } from "@ormx/filters/supabase";
import { buildTypeOrmFilters } from "@ormx/filters/typeorm";
```

## Usage

### Define filters using the common format

```typescript
import type { QueryFilters } from "@ormx/filters";

type User = {
  id: number;
  name: string;
  email: string | null;
  age: number;
  status: string;
  createdAt: Date;
  posts: Post[];
};

const filters: QueryFilters<User> = {
  where: {
    name: { Contains: "john" },
    age: { GTE: 18, LTE: 65 },
    email: { IsNotNull: true },
    OneOf: [{ status: { Is: "active" } }, { status: { Is: "pending" } }],
  },
  select: {
    id: true,
    name: true,
    posts: { select: { title: true }, where: { published: { Is: true } }, order: { createdAt: "desc" }, limit: 5 },
  },
  order: { createdAt: "desc", name: "asc" },
  limit: 20,
  offset: 40,
};
```

`where` and `order` accept scalar fields only. Relations are queried through nested filters in `select`. Prisma and Supabase support every nested clause; TypeORM supports nested projection but not relation-scoped filtering, ordering or pagination. MikroORM supports relation-scoped ordering, and filtering on top-level relations, but not pagination.

### Prisma

```typescript
import { buildPrismaFilters } from "@ormx/filters/prisma";

const users = await prisma.user.findMany(buildPrismaFilters(filters));
```

The result only contains the clauses you set, so it can be passed to `findMany`, `findFirst`, `count`, or nested relation queries as is:

```typescript
{
  where: { name: { contains: "john", mode: "insensitive" }, age: { gte: 18, lte: 65 }, email: { not: null }, OR: [...] },
  select: { id: true, name: true, posts: { select: { title: true }, where: {...}, orderBy: [{ createdAt: "desc" }], take: 5 } },
  orderBy: [{ createdAt: "desc" }, { name: "asc" }],
  take: 20,
  skip: 40,
}
```

Text operators add `mode: "insensitive"` so they behave like Drizzle and Supabase. This is only supported by PostgreSQL and MongoDB. Pass `{ caseInsensitive: false }` on other databases:

```typescript
buildPrismaFilters(filters, { caseInsensitive: false });
```

Prisma applies `mode` to every operator of a field, not just the text ones. So when a field mixes text and exact operators, the text ones move to a separate `AND` entry to keep `Is`, `IsNot` and `In` case-sensitive:

```typescript
buildPrismaWhere({ name: { Contains: "OHN", IsNot: "John" } });
// { name: { not: "John" }, AND: [{ name: { contains: "OHN", mode: "insensitive" } }] }
```

Individual builders are also available: `buildPrismaWhere`, `buildPrismaSelect`, `buildPrismaOrder`.

### Drizzle

```typescript
import { buildDrizzleFilters } from "@ormx/filters/drizzle";
import { buildMikroOrmFilters } from "@ormx/filters/mikro-orm";
import { getTableColumns } from "drizzle-orm";
import { users } from "./schema";

const { where, select, orderBy, limit, offset } = buildDrizzleFilters(filters, users);

const rows = await db
  .select(select ?? getTableColumns(users))
  .from(users)
  .where(where)
  .orderBy(...orderBy)
  .limit(limit ?? 100);
```

The second argument tells the builder where to find columns. It accepts a Drizzle table, a record of columns, or a resolver function `(field) => column`. Unknown fields throw instead of producing broken SQL.

`where` is `undefined` when there is no condition, `select` is `undefined` when every column is selected, and `orderBy` is an empty array when there is no sort. Passing `undefined` to `.where()` and spreading an empty `orderBy` are both valid in Drizzle, so the parts can be applied unconditionally.

Nested selections on relations are not supported by Drizzle's core query builder and throw.

Individual builders are also available: `buildDrizzleWhere`, `buildDrizzleSelect`, `buildDrizzleOrder`.

### TypeORM

```typescript
import { buildTypeOrmFilters } from "@ormx/filters/typeorm";

const repository = dataSource.getRepository(User);
const users = await repository.find(buildTypeOrmFilters(filters, repository.metadata));
```

Passing entity metadata enables relation loading and distinguishes boolean scalar selections from boolean relation selections. Nested relation projections are supported. TypeORM cannot apply `where`, `order`, `limit` or `offset` to a loaded relation without changing which parent rows match, so those nested clauses throw instead of changing semantics silently.

`OneOf` groups are converted to TypeORM's array-of-where-objects form. Text operators use PostgreSQL `ILike`, and multiple operators on one field are combined with TypeORM's `And` operator.

Individual builders are also available: `buildTypeOrmWhere`, `buildTypeOrmSelect`, `buildTypeOrmRelations`, `buildTypeOrmOrder`.

### MikroORM

```typescript
import { buildMikroOrmFilters } from "@ormx/filters/mikro-orm";

const { where, options } = buildMikroOrmFilters(filters, em.getMetadata().find(User));
const users = await em.find(User, where, options);
```

`select` becomes partial loading `fields` as dotted paths (`["id", "posts.title"]`), which also populate the selected relations. Passing entity metadata lets a relation selected with `true` load all of its fields (`posts.*`); without it, only its primary key is loaded. MikroORM always loads primary keys, even when they are not selected.

Nested `where` and `order` on a selected relation become `populateWhere` and `populateOrderBy`, which filter and sort the loaded relation without filtering the root entities. Nested `where` is limited to top-level relations, because on a deeper one MikroORM would also drop intermediate items without a match. Nested `limit` and `offset` throw.

`OneOf` groups become `$or`. Text operators use `$ilike`, which MikroORM only supports on PostgreSQL. Operators sharing a MikroORM key on one field, such as `Contains` with `StartsWith`, are completed through `$and`.

Individual builders are also available: `buildMikroOrmWhere`, `buildMikroOrmSelect`, `buildMikroOrmPopulateFilters`, `buildMikroOrmOrder`.

### Supabase

```typescript
import { buildSupabaseFilters, buildSupabaseSelect } from "@ormx/filters/supabase";

const query = supabase.from("users").select(buildSupabaseSelect(filters.select));
const { data: users } = await buildSupabaseFilters(query, filters);
```

`buildSupabaseSelect` produces the PostgREST columns string, including embedded resources (`"id,name,posts(title)"`). `buildSupabaseFilters` then applies where, order and pagination to the table and to each embedded resource.

PostgREST needs an upper bound for pagination, so `offset` can only be used together with `limit`.

Individual builders are also available: `buildSupabaseWhere`, `buildSupabaseOrder`, `buildSupabaseRange`, and `buildSupabaseWhereString` for raw `.or()` expressions.

## Operators

| Operator     | Description                           | Prisma                            | Drizzle      | TypeORM          | MikroORM     | Supabase      |
| ------------ | ------------------------------------- | --------------------------------- | ------------ | ---------------- | ------------ | ------------- |
| `Is`         | Equals                                | `equals`                          | `eq`         | `Equal`          | `$eq`        | `eq`          |
| `IsNot`      | Not equals                            | `not`                             | `ne`         | `Not(Equal)`     | `$ne`        | `neq`         |
| `GT`         | Greater than                          | `gt`                              | `gt`         | `MoreThan`       | `$gt`        | `gt`          |
| `GTE`        | Greater than or equal                 | `gte`                             | `gte`        | `MoreThanOrEqual`| `$gte`       | `gte`         |
| `LT`         | Less than                             | `lt`                              | `lt`         | `LessThan`       | `$lt`        | `lt`          |
| `LTE`        | Less than or equal                    | `lte`                             | `lte`        | `LessThanOrEqual`| `$lte`       | `lte`         |
| `In`         | Value in array                        | `in`                              | `inArray`    | `In`             | `$in`        | `in`          |
| `NotIn`      | Value not in array                    | `notIn`                           | `notInArray` | `Not(In)`        | `$nin`       | `not.in`      |
| `Contains`   | Contains substring (case-insensitive) | `contains`, `mode: insensitive`   | `ilike`      | `ILike`          | `$ilike`     | `ilike`       |
| `StartsWith` | Starts with (case-insensitive)        | `startsWith`, `mode: insensitive` | `ilike`      | `ILike`          | `$ilike`     | `ilike`       |
| `EndsWith`   | Ends with (case-insensitive)          | `endsWith`, `mode: insensitive`   | `ilike`      | `ILike`          | `$ilike`     | `ilike`       |
| `IsNull`     | Is null                               | `equals: null`                    | `isNull`     | `IsNull`         | `$eq: null`  | `is.null`     |
| `IsNotNull`  | Is not null                           | `not: null`                       | `isNotNull`  | `Not(IsNull)`    | `$ne: null`  | `not.is.null` |

Rules that hold on all five targets:

- Operators on the same field, and across fields, are combined with AND.
- `undefined` and `null` values are skipped, so optional filters can be passed straight through. Falsy values such as `0`, `false` and `""` are kept.
- `IsNull` and `IsNotNull` are flags. They apply unless set to `false`, so a JSON payload sending `null` still works.
- LIKE wildcards (`%`, `_`) in text operators are escaped, so user input is matched literally. Supabase is the one exception: PostgREST also treats `*` as a wildcard in `ilike` values and offers no way to escape it.
- An unknown operator throws, so a typo or a bad payload cannot silently widen a query.

## OR conditions

Use `OneOf` to create OR conditions. Groups can contain several conditions and nest further `OneOf` clauses:

```typescript
const filters: QueryFilters<User> = {
  where: {
    age: { GTE: 18 },
    OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" }, email: { IsNotNull: true } }],
  },
};
```

This translates to `age >= 18 AND (status = 'active' OR (role = 'admin' AND email IS NOT NULL))`.

## Dialect support

The builders target PostgreSQL.

| Target   | Requirement                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------- |
| Prisma   | Text operators use `mode: "insensitive"`, PostgreSQL and MongoDB only. Disable with `caseInsensitive: false`. |
| Drizzle  | Text operators emit `ilike`, which is PostgreSQL-specific. There is no option to change it yet.   |
| TypeORM  | Requires TypeORM 1.0 or later. Text operators use PostgreSQL's `ILike` operator.                  |
| MikroORM | Requires MikroORM 7.0 or later. Text operators use `$ilike`, which MikroORM only supports on PostgreSQL. |
| Supabase | PostgREST is PostgreSQL-only.                                                                     |

## License

MIT
