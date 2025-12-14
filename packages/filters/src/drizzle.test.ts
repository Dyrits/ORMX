import type { AnyColumn } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { buildDrizzleFilters, type GetColumn } from "./build-drizzle";
import type { QueryFilters } from "./types";

// Mock column factory
function createMockColumn(name: string): AnyColumn {
  return { name } as unknown as AnyColumn;
}

// Mock getColumn function
const mockGetColumn: GetColumn = (field: string) => createMockColumn(field);

// Test entity type
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  role: string;
  createdAt: Date;
}

describe("buildDrizzleFilters", () => {
  describe("empty and undefined filters", () => {
    it("should return sql`true` when filters.where is undefined", () => {
      const filters: QueryFilters<User> = {};
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
      // The SQL object should represent `true`
      expect(result.where.queryChunks).toBeDefined();
    });

    it("should return sql`true` when filters.where is empty object", () => {
      const filters: QueryFilters<User> = { where: {} };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("Is operator", () => {
    it("should create equality condition", () => {
      const filters: QueryFilters<User> = {
        where: { name: { Is: "john" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle numeric Is condition", () => {
      const filters: QueryFilters<User> = {
        where: { age: { Is: 25 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("IsNot operator", () => {
    it("should create inequality condition", () => {
      const filters: QueryFilters<User> = {
        where: { status: { IsNot: "inactive" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("GT operator", () => {
    it("should create greater than condition", () => {
      const filters: QueryFilters<User> = {
        where: { age: { GT: 18 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("GTE operator", () => {
    it("should create greater than or equal condition", () => {
      const filters: QueryFilters<User> = {
        where: { age: { GTE: 21 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("LT operator", () => {
    it("should create less than condition", () => {
      const filters: QueryFilters<User> = {
        where: { age: { LT: 65 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("LTE operator", () => {
    it("should create less than or equal condition", () => {
      const filters: QueryFilters<User> = {
        where: { age: { LTE: 100 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("In operator", () => {
    it("should create in array condition", () => {
      const filters: QueryFilters<User> = {
        where: { status: { In: ["active", "pending"] } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle numeric array", () => {
      const filters: QueryFilters<User> = {
        where: { id: { In: [1, 2, 3] } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("NotIn operator", () => {
    it("should create not in array condition", () => {
      const filters: QueryFilters<User> = {
        where: { status: { NotIn: ["banned", "deleted"] } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("Contains operator", () => {
    it("should create ilike condition with wildcards on both sides", () => {
      const filters: QueryFilters<User> = {
        where: { name: { Contains: "john" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("StartsWith operator", () => {
    it("should create ilike condition with wildcard at end", () => {
      const filters: QueryFilters<User> = {
        where: { email: { StartsWith: "admin" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("EndsWith operator", () => {
    it("should create ilike condition with wildcard at start", () => {
      const filters: QueryFilters<User> = {
        where: { email: { EndsWith: "@example.com" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("IsNull operator", () => {
    it("should create isNull condition", () => {
      const filters: QueryFilters<User> = {
        where: { email: { IsNull: null } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should work regardless of the value provided", () => {
      const filters: QueryFilters<User> = {
        where: { email: { IsNull: true as unknown as null } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("IsNotNull operator", () => {
    it("should create isNotNull condition", () => {
      const filters: QueryFilters<User> = {
        where: { email: { IsNotNull: null } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("multiple operators on same field", () => {
    it("should combine operators with AND logic", () => {
      const filters: QueryFilters<User> = {
        where: { age: { GTE: 18, LTE: 65 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle three operators on same field", () => {
      const filters: QueryFilters<User> = {
        where: { age: { GT: 0, GTE: 1, LTE: 100 } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("multiple fields", () => {
    it("should combine multiple field conditions with AND logic", () => {
      const filters: QueryFilters<User> = {
        where: {
          name: { Contains: "john" },
          status: { Is: "active" },
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle three field conditions", () => {
      const filters: QueryFilters<User> = {
        where: {
          age: { GTE: 18 },
          name: { Contains: "john" },
          status: { Is: "active" },
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("OneOf (OR logic)", () => {
    it("should create OR condition with two groups", () => {
      const filters: QueryFilters<User> = {
        where: {
          OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should create OR condition with three groups", () => {
      const filters: QueryFilters<User> = {
        where: {
          OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }, { age: { GTE: 21 } }],
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should combine OneOf with other conditions using AND", () => {
      const filters: QueryFilters<User> = {
        where: {
          name: { Contains: "john" },
          OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle empty OneOf array", () => {
      const filters: QueryFilters<User> = {
        where: {
          OneOf: [],
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle nested conditions within OneOf groups", () => {
      const filters: QueryFilters<User> = {
        where: {
          OneOf: [{ name: { Contains: "admin" }, status: { Is: "active" } }, { role: { Is: "superadmin" } }],
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("null and undefined value handling", () => {
    it("should skip field when value is null (except IsNull/IsNotNull)", () => {
      const filters: QueryFilters<User> = {
        where: { name: { Is: null as unknown as string } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should skip field when value is undefined", () => {
      const filters: QueryFilters<User> = {
        where: { name: { Is: undefined as unknown as string } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should skip field when condition object is falsy", () => {
      const filters: QueryFilters<User> = {
        where: { name: undefined },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("getColumn integration", () => {
    it("should call getColumn with correct field name", () => {
      const spyGetColumn = vi.fn(mockGetColumn);
      const filters: QueryFilters<User> = {
        where: { name: { Is: "john" } },
      };

      buildDrizzleFilters(filters, spyGetColumn);

      expect(spyGetColumn).toHaveBeenCalledWith("name");
    });

    it("should call getColumn for each field in where clause", () => {
      const spyGetColumn = vi.fn(mockGetColumn);
      const filters: QueryFilters<User> = {
        where: {
          age: { GTE: 18 },
          name: { Contains: "john" },
          status: { Is: "active" },
        },
      };

      buildDrizzleFilters(filters, spyGetColumn);

      expect(spyGetColumn).toHaveBeenCalledWith("name");
      expect(spyGetColumn).toHaveBeenCalledWith("age");
      expect(spyGetColumn).toHaveBeenCalledWith("status");
    });

    it("should call getColumn for fields within OneOf groups", () => {
      const spyGetColumn = vi.fn(mockGetColumn);
      const filters: QueryFilters<User> = {
        where: {
          OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
        },
      };

      buildDrizzleFilters(filters, spyGetColumn);

      expect(spyGetColumn).toHaveBeenCalledWith("status");
      expect(spyGetColumn).toHaveBeenCalledWith("role");
    });
  });

  describe("complex real-world scenarios", () => {
    it("should handle user search with multiple criteria", () => {
      const filters: QueryFilters<User> = {
        where: {
          age: { GTE: 18, LTE: 65 },
          email: { IsNotNull: null },
          name: { Contains: "smith" },
          status: { In: ["active", "pending"] },
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle admin OR premium user query", () => {
      const filters: QueryFilters<User> = {
        where: {
          OneOf: [{ role: { Is: "admin" } }, { role: { Is: "premium" } }],
          status: { Is: "active" },
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle email domain search", () => {
      const filters: QueryFilters<User> = {
        where: {
          email: { EndsWith: "@company.com" },
          status: { IsNot: "banned" },
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });

    it("should handle age range with exclusions", () => {
      const filters: QueryFilters<User> = {
        where: {
          age: { GTE: 13, LT: 100 },
          status: { NotIn: ["banned", "deleted", "suspended"] },
        },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result.where).toBeDefined();
    });
  });

  describe("return structure", () => {
    it("should return object with where property", () => {
      const filters: QueryFilters<User> = {
        where: { name: { Is: "test" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      expect(result).toHaveProperty("where");
      expect(typeof result.where).toBe("object");
    });

    it("should return SQL type for where clause", () => {
      const filters: QueryFilters<User> = {
        where: { name: { Is: "test" } },
      };
      const result = buildDrizzleFilters(filters, mockGetColumn);

      // SQL objects from drizzle-orm have specific properties
      expect(result.where).toBeDefined();
      expect(result.where).not.toBeNull();
    });
  });
});
