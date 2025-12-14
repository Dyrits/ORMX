# ORQ - Object Relational Query

Unified query filtering across Prisma, Drizzle, and Supabase.

Write your filters once using a common format, then convert them to the native format for your ORM or database client.

## Installation

```bash
npm install or-query
# or
bun add or-query
```

For Drizzle support, you also need `drizzle-orm`:

```bash
npm install drizzle-orm
```

## Usage

### Define filters using the common format

```typescript
import type { QueryFilters } from "or-query";

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
import { toPrisma } from "or-query";

const prismaQuery = toPrisma(filters);
// Result:
// {
//   where: {
//     name: { contains: "john" },
//     age: { gte: 18, lte: 65 },
//     status: { equals: "active" }
//   }
// }

const users = await prisma.user.findMany(prismaQuery);
```

### Convert to Supabase

```typescript
import { toSupabase } from "or-query";

const query = supabase.from("users").select();
const filteredQuery = toSupabase(query, filters);

const { data: users } = await filteredQuery;
```

### Convert to Drizzle

```typescript
import { toDrizzle } from "or-query";
import { users } from "./schema";

const getColumn = (field: string) => users[field as keyof typeof users];
const { where } = toDrizzle(filters, getColumn);

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
// Only Prisma
import { toPrisma } from "or-query/prisma";

// Only Supabase
import { toSupabase } from "or-query/supabase";

// Only Drizzle
import { toDrizzle } from "or-query/drizzle";
```

## License

MIT
