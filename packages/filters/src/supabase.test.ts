import { describe, expect, it, vi } from "vitest";
import { buildSupabaseFilters } from "./build-supabase";
import { buildSupabaseWhere, type FilterBuilder } from "./where/build-supabase";
import type { QueryFilters } from "./types";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  role: string;
  createdAt: Date;
}

// Mock FilterBuilder factory
function createMockQuery(): FilterBuilder<User> & { calls: { method: string; args: unknown[] }[] } {
  const calls: { method: string; args: unknown[] }[] = [];

  const query: FilterBuilder<User> & { calls: { method: string; args: unknown[] }[] } = {
    calls,
    eq(column: string, value: unknown) {
      calls.push({ method: "eq", args: [column, value] });
      return query;
    },
    neq(column: string, value: unknown) {
      calls.push({ method: "neq", args: [column, value] });
      return query;
    },
    gt(column: string, value: unknown) {
      calls.push({ method: "gt", args: [column, value] });
      return query;
    },
    gte(column: string, value: unknown) {
      calls.push({ method: "gte", args: [column, value] });
      return query;
    },
    lt(column: string, value: unknown) {
      calls.push({ method: "lt", args: [column, value] });
      return query;
    },
    lte(column: string, value: unknown) {
      calls.push({ method: "lte", args: [column, value] });
      return query;
    },
    in(column: string, values: unknown[]) {
      calls.push({ method: "in", args: [column, values] });
      return query;
    },
    ilike(column: string, pattern: string) {
      calls.push({ method: "ilike", args: [column, pattern] });
      return query;
    },
    is(column: string, value: null) {
      calls.push({ method: "is", args: [column, value] });
      return query;
    },
    not(column: string, operator: string, value: unknown) {
      calls.push({ method: "not", args: [column, operator, value] });
      return query;
    },
    or(filters: string) {
      calls.push({ method: "or", args: [filters] });
      return query;
    },
    filter(column: string, operator: string, value: unknown) {
      calls.push({ method: "filter", args: [column, operator, value] });
      return query;
    },
  };

  return query;
}

describe("buildSupabaseWhere", () => {
  describe("empty and undefined filters", () => {
    it("should return query unchanged when where is undefined", () => {
      const query = createMockQuery();
      const result = buildSupabaseWhere(query, undefined);
      expect(result).toBe(query);
      expect(query.calls).toHaveLength(0);
    });

    it("should return query unchanged when where is empty", () => {
      const query = createMockQuery();
      const result = buildSupabaseWhere(query, {});
      expect(result).toBe(query);
      expect(query.calls).toHaveLength(0);
    });
  });

  describe("Is operator", () => {
    it("should call filter with eq", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { name: { Is: "john" } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["name", "eq", "john"] });
    });

    it("should handle numeric Is condition", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { Is: 25 } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "eq", 25] });
    });
  });

  describe("IsNot operator", () => {
    it("should call filter with neq", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { status: { IsNot: "inactive" } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["status", "neq", "inactive"] });
    });
  });

  describe("GT operator", () => {
    it("should call filter with gt", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { GT: 18 } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "gt", 18] });
    });
  });

  describe("GTE operator", () => {
    it("should call filter with gte", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { GTE: 21 } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "gte", 21] });
    });
  });

  describe("LT operator", () => {
    it("should call filter with lt", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { LT: 65 } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "lt", 65] });
    });
  });

  describe("LTE operator", () => {
    it("should call filter with lte", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { LTE: 100 } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "lte", 100] });
    });
  });

  describe("In operator", () => {
    it("should call filter with in", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { status: { In: ["active", "pending"] } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["status", "in", ["active", "pending"]] });
    });

    it("should handle numeric array", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { id: { In: [1, 2, 3] } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["id", "in", [1, 2, 3]] });
    });
  });

  describe("NotIn operator", () => {
    it("should call not with in operator", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { status: { NotIn: ["banned", "deleted"] } });
      expect(query.calls).toContainEqual({ method: "not", args: ["status", "in", "(banned,deleted)"] });
    });
  });

  describe("Contains operator", () => {
    it("should call filter with ilike and wildcards", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { name: { Contains: "john" } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["name", "ilike", "%john%"] });
    });
  });

  describe("StartsWith operator", () => {
    it("should call filter with ilike and trailing wildcard", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { StartsWith: "admin" } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["email", "ilike", "admin%"] });
    });
  });

  describe("EndsWith operator", () => {
    it("should call filter with ilike and leading wildcard", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { EndsWith: "@example.com" } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["email", "ilike", "%@example.com"] });
    });
  });

  describe("IsNull operator", () => {
    it("should call is with null", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { IsNull: null } });
      expect(query.calls).toContainEqual({ method: "is", args: ["email", null] });
    });
  });

  describe("IsNotNull operator", () => {
    it("should call not with is null", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { IsNotNull: null } });
      expect(query.calls).toContainEqual({ method: "not", args: ["email", "is", null] });
    });
  });

  describe("multiple operators on same field", () => {
    it("should call filter for each operator", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { GTE: 18, LTE: 65 } });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "gte", 18] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "lte", 65] });
    });
  });

  describe("multiple fields", () => {
    it("should call filter for each field", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        name: { Contains: "john" },
        status: { Is: "active" },
      });
      expect(query.calls).toContainEqual({ method: "filter", args: ["name", "ilike", "%john%"] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["status", "eq", "active"] });
    });
  });

  describe("OneOf (OR logic)", () => {
    it("should call or with condition string", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
      });
      expect(query.calls).toContainEqual({ method: "or", args: ["status.eq.active,role.eq.admin"] });
    });

    it("should handle nested conditions within OneOf groups", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        OneOf: [{ name: { Contains: "admin" }, status: { Is: "active" } }, { role: { Is: "superadmin" } }],
      });
      // First group has multiple conditions, wrapped in and()
      expect(query.calls).toContainEqual({
        method: "or",
        args: ["and(name.ilike.%admin%,status.eq.active),role.eq.superadmin"],
      });
    });

    it("should handle empty OneOf array", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { OneOf: [] });
      expect(query.calls.filter((c) => c.method === "or")).toHaveLength(0);
    });

    it("should combine OneOf with other conditions", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        name: { Contains: "john" },
        OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
      });
      expect(query.calls).toContainEqual({ method: "filter", args: ["name", "ilike", "%john%"] });
      expect(query.calls).toContainEqual({ method: "or", args: ["status.eq.active,role.eq.admin"] });
    });
  });

  describe("null and undefined value handling", () => {
    it("should skip field when condition is undefined", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { name: undefined });
      expect(query.calls).toHaveLength(0);
    });
  });

  describe("complex real-world scenarios", () => {
    it("should handle user search with multiple criteria", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        age: { GTE: 18, LTE: 65 },
        email: { IsNotNull: null },
        name: { Contains: "smith" },
        status: { In: ["active", "pending"] },
      });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "gte", 18] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "lte", 65] });
      expect(query.calls).toContainEqual({ method: "not", args: ["email", "is", null] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["name", "ilike", "%smith%"] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["status", "in", ["active", "pending"]] });
    });

    it("should handle admin OR premium user query", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        OneOf: [{ role: { Is: "admin" } }, { role: { Is: "premium" } }],
        status: { Is: "active" },
      });
      expect(query.calls).toContainEqual({ method: "or", args: ["role.eq.admin,role.eq.premium"] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["status", "eq", "active"] });
    });

    it("should handle email domain search", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        email: { EndsWith: "@company.com" },
        status: { IsNot: "banned" },
      });
      expect(query.calls).toContainEqual({ method: "filter", args: ["email", "ilike", "%@company.com"] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["status", "neq", "banned"] });
    });

    it("should handle age range with exclusions", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        age: { GTE: 13, LT: 100 },
        status: { NotIn: ["banned", "deleted", "suspended"] },
      });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "gte", 13] });
      expect(query.calls).toContainEqual({ method: "filter", args: ["age", "lt", 100] });
      expect(query.calls).toContainEqual({ method: "not", args: ["status", "in", "(banned,deleted,suspended)"] });
    });
  });
});

describe("buildSupabaseFilters", () => {
  it("should apply where filters to query", () => {
    const query = createMockQuery();
    const filters: QueryFilters<User> = {
      where: { name: { Is: "test" } },
    };
    buildSupabaseFilters(query, filters);
    expect(query.calls).toContainEqual({ method: "filter", args: ["name", "eq", "test"] });
  });

  it("should handle empty filters", () => {
    const query = createMockQuery();
    const filters: QueryFilters<User> = {};
    buildSupabaseFilters(query, filters);
    expect(query.calls).toHaveLength(0);
  });

  it("should handle complex filters", () => {
    const query = createMockQuery();
    const filters: QueryFilters<User> = {
      where: {
        age: { GTE: 18 },
        status: { Is: "active" },
        OneOf: [{ role: { Is: "admin" } }, { role: { Is: "moderator" } }],
      },
    };
    buildSupabaseFilters(query, filters);
    expect(query.calls).toContainEqual({ method: "filter", args: ["age", "gte", 18] });
    expect(query.calls).toContainEqual({ method: "filter", args: ["status", "eq", "active"] });
    expect(query.calls).toContainEqual({ method: "or", args: ["role.eq.admin,role.eq.moderator"] });
  });
});
