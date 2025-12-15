import { describe, expect, it } from "vitest";
import { buildSupabaseFilters } from "./build-supabase";
import type { QueryFilters } from "./types";
import { buildSupabaseWhere, type SupabaseFilterBuilder } from "./where/build-supabase";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  role: string;
  createdAt: Date;
}

// Mock SupabaseFilterBuilder factory
function createMockQuery(): SupabaseFilterBuilder<User> & { calls: { method: string; args: unknown[] }[] } {
  const calls: { method: string; args: unknown[] }[] = [];

  const query: SupabaseFilterBuilder<User> & { calls: { method: string; args: unknown[] }[] } = {
    calls,
    eq(column: string, value: unknown) {
      calls.push({ args: [column, value], method: "eq" });
      return query;
    },
    filter(column: string, operator: string, value: unknown) {
      calls.push({ args: [column, operator, value], method: "filter" });
      return query;
    },
    gt(column: string, value: unknown) {
      calls.push({ args: [column, value], method: "gt" });
      return query;
    },
    gte(column: string, value: unknown) {
      calls.push({ args: [column, value], method: "gte" });
      return query;
    },
    ilike(column: string, pattern: string) {
      calls.push({ args: [column, pattern], method: "ilike" });
      return query;
    },
    in(column: string, values: unknown[]) {
      calls.push({ args: [column, values], method: "in" });
      return query;
    },
    is(column: string, value: null) {
      calls.push({ args: [column, value], method: "is" });
      return query;
    },
    lt(column: string, value: unknown) {
      calls.push({ args: [column, value], method: "lt" });
      return query;
    },
    lte(column: string, value: unknown) {
      calls.push({ args: [column, value], method: "lte" });
      return query;
    },
    neq(column: string, value: unknown) {
      calls.push({ args: [column, value], method: "neq" });
      return query;
    },
    not(column: string, operator: string, value: unknown) {
      calls.push({ args: [column, operator, value], method: "not" });
      return query;
    },
    or(filters: string) {
      calls.push({ args: [filters], method: "or" });
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
      expect(query.calls).toContainEqual({ args: ["name", "eq", "john"], method: "filter" });
    });

    it("should handle numeric Is condition", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { Is: 25 } });
      expect(query.calls).toContainEqual({ args: ["age", "eq", 25], method: "filter" });
    });
  });

  describe("IsNot operator", () => {
    it("should call filter with neq", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { status: { IsNot: "inactive" } });
      expect(query.calls).toContainEqual({ args: ["status", "neq", "inactive"], method: "filter" });
    });
  });

  describe("GT operator", () => {
    it("should call filter with gt", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { GT: 18 } });
      expect(query.calls).toContainEqual({ args: ["age", "gt", 18], method: "filter" });
    });
  });

  describe("GTE operator", () => {
    it("should call filter with gte", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { GTE: 21 } });
      expect(query.calls).toContainEqual({ args: ["age", "gte", 21], method: "filter" });
    });
  });

  describe("LT operator", () => {
    it("should call filter with lt", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { LT: 65 } });
      expect(query.calls).toContainEqual({ args: ["age", "lt", 65], method: "filter" });
    });
  });

  describe("LTE operator", () => {
    it("should call filter with lte", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { LTE: 100 } });
      expect(query.calls).toContainEqual({ args: ["age", "lte", 100], method: "filter" });
    });
  });

  describe("In operator", () => {
    it("should call filter with in", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { status: { In: ["active", "pending"] } });
      expect(query.calls).toContainEqual({ args: ["status", "in", ["active", "pending"]], method: "filter" });
    });

    it("should handle numeric array", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { id: { In: [1, 2, 3] } });
      expect(query.calls).toContainEqual({ args: ["id", "in", [1, 2, 3]], method: "filter" });
    });
  });

  describe("NotIn operator", () => {
    it("should call not with in operator", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { status: { NotIn: ["banned", "deleted"] } });
      expect(query.calls).toContainEqual({ args: ["status", "in", "(banned,deleted)"], method: "not" });
    });
  });

  describe("Contains operator", () => {
    it("should call filter with ilike and wildcards", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { name: { Contains: "john" } });
      expect(query.calls).toContainEqual({ args: ["name", "ilike", "%john%"], method: "filter" });
    });
  });

  describe("StartsWith operator", () => {
    it("should call filter with ilike and trailing wildcard", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { StartsWith: "admin" } });
      expect(query.calls).toContainEqual({ args: ["email", "ilike", "admin%"], method: "filter" });
    });
  });

  describe("EndsWith operator", () => {
    it("should call filter with ilike and leading wildcard", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { EndsWith: "@example.com" } });
      expect(query.calls).toContainEqual({ args: ["email", "ilike", "%@example.com"], method: "filter" });
    });
  });

  describe("IsNull operator", () => {
    it("should call is with null", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { IsNull: null } });
      expect(query.calls).toContainEqual({ args: ["email", null], method: "is" });
    });
  });

  describe("IsNotNull operator", () => {
    it("should call not with is null", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { email: { IsNotNull: null } });
      expect(query.calls).toContainEqual({ args: ["email", "is", null], method: "not" });
    });
  });

  describe("multiple operators on same field", () => {
    it("should call filter for each operator", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, { age: { GTE: 18, LTE: 65 } });
      expect(query.calls).toContainEqual({ args: ["age", "gte", 18], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["age", "lte", 65], method: "filter" });
    });
  });

  describe("multiple fields", () => {
    it("should call filter for each field", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        name: { Contains: "john" },
        status: { Is: "active" },
      });
      expect(query.calls).toContainEqual({ args: ["name", "ilike", "%john%"], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["status", "eq", "active"], method: "filter" });
    });
  });

  describe("OneOf (OR logic)", () => {
    it("should call or with condition string", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
      });
      expect(query.calls).toContainEqual({ args: ["status.eq.active,role.eq.admin"], method: "or" });
    });

    it("should handle nested conditions within OneOf groups", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        OneOf: [{ name: { Contains: "admin" }, status: { Is: "active" } }, { role: { Is: "superadmin" } }],
      });
      // First group has multiple conditions, wrapped in and()
      expect(query.calls).toContainEqual({
        args: ["and(name.ilike.%admin%,status.eq.active),role.eq.superadmin"],
        method: "or",
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
      expect(query.calls).toContainEqual({ args: ["name", "ilike", "%john%"], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["status.eq.active,role.eq.admin"], method: "or" });
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
      expect(query.calls).toContainEqual({ args: ["age", "gte", 18], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["age", "lte", 65], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["email", "is", null], method: "not" });
      expect(query.calls).toContainEqual({ args: ["name", "ilike", "%smith%"], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["status", "in", ["active", "pending"]], method: "filter" });
    });

    it("should handle admin OR premium user query", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        OneOf: [{ role: { Is: "admin" } }, { role: { Is: "premium" } }],
        status: { Is: "active" },
      });
      expect(query.calls).toContainEqual({ args: ["role.eq.admin,role.eq.premium"], method: "or" });
      expect(query.calls).toContainEqual({ args: ["status", "eq", "active"], method: "filter" });
    });

    it("should handle email domain search", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        email: { EndsWith: "@company.com" },
        status: { IsNot: "banned" },
      });
      expect(query.calls).toContainEqual({ args: ["email", "ilike", "%@company.com"], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["status", "neq", "banned"], method: "filter" });
    });

    it("should handle age range with exclusions", () => {
      const query = createMockQuery();
      buildSupabaseWhere<User>(query, {
        age: { GTE: 13, LT: 100 },
        status: { NotIn: ["banned", "deleted", "suspended"] },
      });
      expect(query.calls).toContainEqual({ args: ["age", "gte", 13], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["age", "lt", 100], method: "filter" });
      expect(query.calls).toContainEqual({ args: ["status", "in", "(banned,deleted,suspended)"], method: "not" });
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
    expect(query.calls).toContainEqual({ args: ["name", "eq", "test"], method: "filter" });
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
        OneOf: [{ role: { Is: "admin" } }, { role: { Is: "moderator" } }],
        status: { Is: "active" },
      },
    };
    buildSupabaseFilters(query, filters);
    expect(query.calls).toContainEqual({ args: ["age", "gte", 18], method: "filter" });
    expect(query.calls).toContainEqual({ args: ["status", "eq", "active"], method: "filter" });
    expect(query.calls).toContainEqual({ args: ["role.eq.admin,role.eq.moderator"], method: "or" });
  });
});
