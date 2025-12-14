# @ormx/filters

Unified query filtering across Prisma, Drizzle, and Supabase.

Write your filters once using a common format, then convert them to the native format for your ORM or database client.

## Installation

```bash
npm install @ormx/filters
# or
bun add @ormx/filters
```

For Drizzle support, you also need `drizzle-orm`:

```bash
npm install drizzle-orm
```

## Usage

### Define filters using the common format

```typescript
import type { QueryFilters } from "@ormx/filters";

type User = {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
};

const filters: QueryFilters<User> = {
  where: {
    name: { Contains: "john" },
    age: { GTE: 18, LTE: 65 },
    status: { Is: "active" },
  },
};
```

### Convert to Prisma

```typescript
import { buildPrismaFilters, buildPrismaWhere } from "@ormx/filters";

// Build full filters
const prismaQuery = buildPrismaFilters(filters);
// { where: { name: { contains: "john" }, age: { gte: 18, lte: 65 }, status: { equals: "active" } } }

const users = await prisma.user.findMany(prismaQuery);

// Or build just the where clause
const where = buildPrismaWhere(filters.where);
```

### Convert to Supabase

```typescript
import { buildSupabaseFilters, buildSupabaseWhere } from "@ormx/filters";

const query = supabase.from("users").select();

// Build full filters
const filteredQuery = buildSupabaseFilters(query, filters);

// Or build just the where clause
const whereQuery = buildSupabaseWhere(query, filters.where);

const { data: users } = await filteredQuery;
```

### Convert to Drizzle

```typescript
import { buildDrizzleFilters, buildDrizzleWhere } from "@ormx/filters";
import { getTableColumns } from "drizzle-orm";
import { users } from "./schema";

const columns = getTableColumns(users);
const getColumn = (field: string) => columns[field as keyof typeof columns];

// Build full filters
const { where } = buildDrizzleFilters(filters, getColumn);

// Or build just the where clause
const whereClause = buildDrizzleWhere(filters.where, getColumn);

const result = await db.select().from(users).where(where);
```

## Operators

| Operator     | Description                    | Prisma        | Supabase  | Drizzle      |
| ------------ | ------------------------------ | ------------- | --------- | ------------ |
| `Is`         | Equals                         | `equals`      | `eq`      | `eq`         |
| `IsNot`      | Not equals                     | `not`         | `neq`     | `ne`         |
| `GT`         | Greater than                   | `gt`          | `gt`      | `gt`         |
| `GTE`        | Greater than or equal          | `gte`         | `gte`     | `gte`        |
| `LT`         | Less than                      | `lt`          | `lt`      | `lt`         |
| `LTE`        | Less than or equal             | `lte`         | `lte`     | `lte`        |
| `In`         | Value in array                 | `in`          | `in`      | `inArray`    |
| `NotIn`      | Value not in array             | `notIn`       | `not.in`  | `notInArray` |
| `Contains`   | Contains substring (case-insensitive) | `contains` | `ilike`   | `ilike`      |
| `StartsWith` | Starts with (case-insensitive) | `startsWith`  | `ilike`   | `ilike`      |
| `EndsWith`   | Ends with (case-insensitive)   | `endsWith`    | `ilike`   | `ilike`      |
| `IsNull`     | Is null                        | `equals: null`| `is.null` | `isNull`     |
| `IsNotNull`  | Is not null                    | `not: null`   | `not.is.null` | `isNotNull` |

## OR Conditions (OneOf)

Use `OneOf` to create OR conditions:

```typescript
const filters: QueryFilters<User> = {
  where: {
    age: { GTE: 18 },
    OneOf: [
      { status: { Is: "active" } },
      { role: { Is: "admin" } },
    ],
  },
};
```

This translates to: `age >= 18 AND (status = 'active' OR role = 'admin')`

## Tree-shakeable Imports

Import only what you need:

```typescript
// Full filters for each ORM
import { buildPrismaFilters } from "@ormx/filters/prisma";
import { buildSupabaseFilters } from "@ormx/filters/supabase";
import { buildDrizzleFilters } from "@ormx/filters/drizzle";

// Just the where builders
import { buildPrismaWhere } from "@ormx/filters/where/prisma";
import { buildSupabaseWhere } from "@ormx/filters/where/supabase";
import { buildDrizzleWhere } from "@ormx/filters/where/drizzle";
```

## License

MIT
