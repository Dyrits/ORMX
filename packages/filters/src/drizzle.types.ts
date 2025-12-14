import type { AnyColumn } from "drizzle-orm";

/**
 * Function to resolve a field name to a Drizzle column.
 */
export type GetColumn = (field: string) => AnyColumn;
