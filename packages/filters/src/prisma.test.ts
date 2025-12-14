import { describe, expect, it } from "vitest";
import { buildPrismaFilters } from "./build-prisma";
import type { QueryFilters } from "./types";
import { buildPrismaWhere } from "./where/build-prisma";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  role: string;
  createdAt: Date;
}

describe("buildPrismaWhere", () => {
  describe("empty and undefined filters", () => {
    it("should return empty object when where is undefined", () => {
      const result = buildPrismaWhere<User>(undefined);
      expect(result).toEqual({});
    });

    it("should return empty object when where is empty", () => {
      const result = buildPrismaWhere<User>({});
      expect(result).toEqual({});
    });
  });

  describe("Is operator", () => {
    it("should create equals condition", () => {
      const result = buildPrismaWhere<User>({ name: { Is: "john" } });
      expect(result).toEqual({ name: { equals: "john" } });
    });

    it("should handle numeric Is condition", () => {
      const result = buildPrismaWhere<User>({ age: { Is: 25 } });
      expect(result).toEqual({ age: { equals: 25 } });
    });
  });

  describe("IsNot operator", () => {
    it("should create not condition", () => {
      const result = buildPrismaWhere<User>({ status: { IsNot: "inactive" } });
      expect(result).toEqual({ status: { not: "inactive" } });
    });
  });

  describe("GT operator", () => {
    it("should create greater than condition", () => {
      const result = buildPrismaWhere<User>({ age: { GT: 18 } });
      expect(result).toEqual({ age: { gt: 18 } });
    });
  });

  describe("GTE operator", () => {
    it("should create greater than or equal condition", () => {
      const result = buildPrismaWhere<User>({ age: { GTE: 21 } });
      expect(result).toEqual({ age: { gte: 21 } });
    });
  });

  describe("LT operator", () => {
    it("should create less than condition", () => {
      const result = buildPrismaWhere<User>({ age: { LT: 65 } });
      expect(result).toEqual({ age: { lt: 65 } });
    });
  });

  describe("LTE operator", () => {
    it("should create less than or equal condition", () => {
      const result = buildPrismaWhere<User>({ age: { LTE: 100 } });
      expect(result).toEqual({ age: { lte: 100 } });
    });
  });

  describe("In operator", () => {
    it("should create in array condition", () => {
      const result = buildPrismaWhere<User>({ status: { In: ["active", "pending"] } });
      expect(result).toEqual({ status: { in: ["active", "pending"] } });
    });

    it("should handle numeric array", () => {
      const result = buildPrismaWhere<User>({ id: { In: [1, 2, 3] } });
      expect(result).toEqual({ id: { in: [1, 2, 3] } });
    });
  });

  describe("NotIn operator", () => {
    it("should create notIn condition", () => {
      const result = buildPrismaWhere<User>({ status: { NotIn: ["banned", "deleted"] } });
      expect(result).toEqual({ status: { notIn: ["banned", "deleted"] } });
    });
  });

  describe("Contains operator", () => {
    it("should create contains condition", () => {
      const result = buildPrismaWhere<User>({ name: { Contains: "john" } });
      expect(result).toEqual({ name: { contains: "john" } });
    });
  });

  describe("StartsWith operator", () => {
    it("should create startsWith condition", () => {
      const result = buildPrismaWhere<User>({ email: { StartsWith: "admin" } });
      expect(result).toEqual({ email: { startsWith: "admin" } });
    });
  });

  describe("EndsWith operator", () => {
    it("should create endsWith condition", () => {
      const result = buildPrismaWhere<User>({ email: { EndsWith: "@example.com" } });
      expect(result).toEqual({ email: { endsWith: "@example.com" } });
    });
  });

  describe("IsNull operator", () => {
    it("should create equals null condition", () => {
      const result = buildPrismaWhere<User>({ email: { IsNull: null } });
      expect(result).toEqual({ email: { equals: null } });
    });
  });

  describe("IsNotNull operator", () => {
    it("should create not null condition", () => {
      const result = buildPrismaWhere<User>({ email: { IsNotNull: null } });
      expect(result).toEqual({ email: { not: null } });
    });
  });

  describe("multiple operators on same field", () => {
    it("should combine operators", () => {
      const result = buildPrismaWhere<User>({ age: { GTE: 18, LTE: 65 } });
      expect(result).toEqual({ age: { gte: 18, lte: 65 } });
    });

    it("should handle three operators on same field", () => {
      const result = buildPrismaWhere<User>({ age: { GT: 0, GTE: 1, LTE: 100 } });
      expect(result).toEqual({ age: { gt: 0, gte: 1, lte: 100 } });
    });
  });

  describe("multiple fields", () => {
    it("should combine multiple field conditions", () => {
      const result = buildPrismaWhere<User>({
        name: { Contains: "john" },
        status: { Is: "active" },
      });
      expect(result).toEqual({
        name: { contains: "john" },
        status: { equals: "active" },
      });
    });

    it("should handle three field conditions", () => {
      const result = buildPrismaWhere<User>({
        age: { GTE: 18 },
        name: { Contains: "john" },
        status: { Is: "active" },
      });
      expect(result).toEqual({
        age: { gte: 18 },
        name: { contains: "john" },
        status: { equals: "active" },
      });
    });
  });

  describe("OneOf (OR logic)", () => {
    it("should create OR condition with two groups", () => {
      const result = buildPrismaWhere<User>({
        OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
      });
      expect(result).toEqual({
        OR: [{ status: { equals: "active" } }, { role: { equals: "admin" } }],
      });
    });

    it("should create OR condition with three groups", () => {
      const result = buildPrismaWhere<User>({
        OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }, { age: { GTE: 21 } }],
      });
      expect(result).toEqual({
        OR: [{ status: { equals: "active" } }, { role: { equals: "admin" } }, { age: { gte: 21 } }],
      });
    });

    it("should combine OneOf with other conditions", () => {
      const result = buildPrismaWhere<User>({
        name: { Contains: "john" },
        OneOf: [{ status: { Is: "active" } }, { role: { Is: "admin" } }],
      });
      expect(result).toEqual({
        name: { contains: "john" },
        OR: [{ status: { equals: "active" } }, { role: { equals: "admin" } }],
      });
    });

    it("should handle empty OneOf array", () => {
      const result = buildPrismaWhere<User>({
        OneOf: [],
      });
      expect(result).toEqual({});
    });

    it("should handle nested conditions within OneOf groups", () => {
      const result = buildPrismaWhere<User>({
        OneOf: [{ name: { Contains: "admin" }, status: { Is: "active" } }, { role: { Is: "superadmin" } }],
      });
      expect(result).toEqual({
        OR: [{ name: { contains: "admin" }, status: { equals: "active" } }, { role: { equals: "superadmin" } }],
      });
    });
  });

  describe("null and undefined value handling", () => {
    it("should skip field when condition is undefined", () => {
      const result = buildPrismaWhere<User>({ name: undefined });
      expect(result).toEqual({});
    });
  });

  describe("complex real-world scenarios", () => {
    it("should handle user search with multiple criteria", () => {
      const result = buildPrismaWhere<User>({
        age: { GTE: 18, LTE: 65 },
        email: { IsNotNull: null },
        name: { Contains: "smith" },
        status: { In: ["active", "pending"] },
      });
      expect(result).toEqual({
        age: { gte: 18, lte: 65 },
        email: { not: null },
        name: { contains: "smith" },
        status: { in: ["active", "pending"] },
      });
    });

    it("should handle admin OR premium user query", () => {
      const result = buildPrismaWhere<User>({
        OneOf: [{ role: { Is: "admin" } }, { role: { Is: "premium" } }],
        status: { Is: "active" },
      });
      expect(result).toEqual({
        OR: [{ role: { equals: "admin" } }, { role: { equals: "premium" } }],
        status: { equals: "active" },
      });
    });

    it("should handle email domain search", () => {
      const result = buildPrismaWhere<User>({
        email: { EndsWith: "@company.com" },
        status: { IsNot: "banned" },
      });
      expect(result).toEqual({
        email: { endsWith: "@company.com" },
        status: { not: "banned" },
      });
    });

    it("should handle age range with exclusions", () => {
      const result = buildPrismaWhere<User>({
        age: { GTE: 13, LT: 100 },
        status: { NotIn: ["banned", "deleted", "suspended"] },
      });
      expect(result).toEqual({
        age: { gte: 13, lt: 100 },
        status: { notIn: ["banned", "deleted", "suspended"] },
      });
    });
  });
});

describe("buildPrismaFilters", () => {
  it("should return object with where property", () => {
    const filters: QueryFilters<User> = {
      where: { name: { Is: "test" } },
    };
    const result = buildPrismaFilters(filters);

    expect(result).toHaveProperty("where");
    expect(result.where).toEqual({ name: { equals: "test" } });
  });

  it("should handle empty filters", () => {
    const filters: QueryFilters<User> = {};
    const result = buildPrismaFilters(filters);

    expect(result.where).toEqual({});
  });

  it("should handle complex filters", () => {
    const filters: QueryFilters<User> = {
      where: {
        age: { GTE: 18 },
        OneOf: [{ role: { Is: "admin" } }, { role: { Is: "moderator" } }],
        status: { Is: "active" },
      },
    };
    const result = buildPrismaFilters(filters);

    expect(result.where).toEqual({
      age: { gte: 18 },
      OR: [{ role: { equals: "admin" } }, { role: { equals: "moderator" } }],
      status: { equals: "active" },
    });
  });
});
