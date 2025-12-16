# @ormx/datasources

Unified datasource abstraction for Drizzle and Supabase with transaction support.

Provides a common interface for CRUD operations across different ORMs, with built-in support for `@ormx/filters`.

## Installation

```bash
npm install @ormx/datasources @ormx/filters
# or
bun add @ormx/datasources @ormx/filters
```

For Drizzle support:

```bash
npm install drizzle-orm
```

For Supabase support:

```bash
npm install @supabase/supabase-js
```

## Usage

### Drizzle Datasource

```typescript
import { DrizzleDatasource } from "@ormx/datasources";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// Create a datasource for the users table
const usersDatasource = new DrizzleDatasource(db, users);

// Create
const user = await usersDatasource.store({ name: "John", email: "john@example.com" });

// Read one
const found = await usersDatasource.lookup({ where: { id: { Is: 1 } } });

// Read many
const activeUsers = await usersDatasource.list({ where: { status: { Is: "active" } } });

// Update
const updated = await usersDatasource.modify(
  { where: { id: { Is: 1 } } },
  { name: "Jane" }
);

// Delete
await usersDatasource.destroy({ where: { id: { Is: 1 } } });
```

### Supabase Datasource

```typescript
import { SupabaseDatasource } from "@ormx/datasources";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Create a datasource for the users table
const usersDatasource = new SupabaseDatasource(supabase, "users");

// Same CRUD API as Drizzle
const user = await usersDatasource.store({ name: "John", email: "john@example.com" });
const found = await usersDatasource.lookup({ where: { id: { Is: 1 } } });
```

## Transactions

### Drizzle Transactions

Use `DrizzleTransactor` for transaction management:

```typescript
import { DrizzleDatasource, DrizzleTransactor } from "@ormx/datasources";
import { users, orders } from "./schema";

const usersDatasource = new DrizzleDatasource(db, users);
const ordersDatasource = new DrizzleDatasource(db, orders);
const transactor = new DrizzleTransactor(db);

await transactor.transact(async (tx) => {
  // Create transaction-scoped datasources
  const txUsers = usersDatasource.withTransaction(tx);
  const txOrders = ordersDatasource.withTransaction(tx);

  // All operations use the same transaction
  const user = await txUsers.store({ name: "John", email: "john@example.com" });
  await txOrders.store({ userId: user.id, total: 100 });

  // If any operation fails, all changes are rolled back
});
```

### Supabase Transactions

The Supabase JS client does not support transactions natively. Calling `withTransaction()` will throw an error:

```typescript
const usersDatasource = new SupabaseDatasource(supabase, "users");

// This throws an error
usersDatasource.withTransaction(supabase);
// Error: SupabaseDatasource does not support transactions.
```

**For Supabase with transactions**, use `DrizzleDatasource` with your Supabase Postgres connection URL:

```typescript
import { DrizzleDatasource, DrizzleTransactor } from "@ormx/datasources";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";

// Use your Supabase database URL directly
const client = postgres(process.env.SUPABASE_DB_URL);
const db = drizzle(client);

const usersDatasource = new DrizzleDatasource(db, users);
const transactor = new DrizzleTransactor(db);

// Now transactions work
await transactor.transact(async (tx) => {
  const txUsers = usersDatasource.withTransaction(tx);
  await txUsers.store({ name: "John" });
});
```

## Interface

All datasources implement the `IDatasource` interface:

```typescript
interface IDatasource<TSelect, TInsert extends Record<string, unknown>, TTransaction> {
  store(payload: TInsert): Promise<TSelect>;
  lookup(filters: QueryFilters<TSelect>): Promise<TSelect>;
  list(filters: QueryFilters<TSelect>): Promise<TSelect[]>;
  modify(filters: QueryFilters<TSelect>, payload: Partial<TInsert>): Promise<TSelect>;
  destroy(filters: QueryFilters<TSelect>): Promise<void>;
  withTransaction(tx: TTransaction): IDatasource<TSelect, TInsert, TTransaction>;
}
```

## Transactor Interface

```typescript
interface ITransactor<TTransaction> {
  transact<TResult>(callback: (transaction: TTransaction) => Promise<TResult>): Promise<TResult>;
}
```

## License

MIT
