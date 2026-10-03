import type { Collection, EntityMetadata } from "@mikro-orm/core";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { QueryFilters, ScalarKeys, Select, Unwrap } from "./index.js";
import { buildMikroOrmFilters, buildMikroOrmOrder, buildMikroOrmPopulateFilters, buildMikroOrmSelect, buildMikroOrmWhere } from "./mikro-orm/index.js";

type Comment = { id: number; body: string };
type Post = { id: number; title: string; comments: Comment[] };
type User = { id: number; name: string; email: string | null; age: number; status: string; posts: Post[] };

/** Just enough metadata to tell relations from scalar fields. */
const metadata = {
  properties: {
    id: { kind: "scalar" },
    name: { kind: "scalar" },
    posts: { kind: "1:m", targetMeta: { properties: { comments: { kind: "1:m" }, title: { kind: "scalar" } } } },
  },
} as unknown as EntityMetadata;

describe("buildMikroOrmWhere", () => {
  it("returns an empty object for empty input", () => {
    expect(buildMikroOrmWhere<User>()).toEqual({});
    expect(buildMikroOrmWhere<User>({})).toEqual({});
  });

  it("maps and combines field operators", () => {
    expect(buildMikroOrmWhere<User>({ age: { GTE: 18, LTE: 65 }, email: { IsNotNull: true }, id: { In: [1, 2] }, status: { NotIn: ["banned"] } })).toEqual({
      age: { $gte: 18, $lte: 65 },
      email: { $ne: null },
      id: { $in: [1, 2] },
      status: { $nin: ["banned"] },
    });
  });

  it("uses case-insensitive patterns and escapes LIKE wildcards", () => {
    expect(buildMikroOrmWhere<User>({ name: { Contains: "50%_off" } })).toEqual({ name: { $ilike: "%50\\%\\_off%" } });
  });

  it("moves operators that share a MikroORM key into $and", () => {
    expect(buildMikroOrmWhere<User>({ name: { Contains: "oh", EndsWith: "n", Is: "John", StartsWith: "J" } })).toEqual({
      $and: [{ name: { $ilike: "%n" } }, { name: { $ilike: "J%" } }],
      name: { $eq: "John", $ilike: "%oh%" },
    });
  });

  it("maps nested OneOf groups to $or and drops empty groups", () => {
    expect(
      buildMikroOrmWhere<User>({
        age: { GTE: 18 },
        OneOf: [{ status: { Is: "active" } }, { name: { Is: undefined } }, { OneOf: [{ age: { LTE: 30 } }, { age: { GTE: 60 } }] }],
      }),
    ).toEqual({
      $or: [{ status: { $eq: "active" } }, { $or: [{ age: { $lte: 30 } }, { age: { $gte: 60 } }] }],
      age: { $gte: 18 },
    });
  });

  it("skips blank values and disabled flags, and rejects unknown operators", () => {
    expect(buildMikroOrmWhere<User>({ email: { IsNull: false }, name: { Is: undefined }, OneOf: [] })).toEqual({});
    expect(buildMikroOrmWhere<User>({ email: { IsNull: null as never } })).toEqual({ email: { $eq: null } });
    expect(() => buildMikroOrmWhere<User>({ name: { Like: "x" } as never })).toThrow('Unknown operator "Like"');
  });
});

describe("MikroORM query options", () => {
  it("maps ordering in priority order", () => {
    expect(Object.keys(buildMikroOrmOrder<User>({ age: "desc", name: "asc" }) ?? {})).toEqual(["age", "name"]);
    expect(buildMikroOrmOrder<User>({ name: undefined })).toBeUndefined();
  });

  it("maps selection to dotted partial loading paths", () => {
    expect(buildMikroOrmSelect<User>({ email: false, id: true, posts: { select: { title: true } } })).toEqual(["id", "posts.title"]);
    expect(buildMikroOrmSelect<User>({ posts: { where: { title: { Is: "x" } } } })).toEqual(["posts.*"]);
    expect(buildMikroOrmSelect<User>({ id: false })).toBeUndefined();
  });

  it("loads relations selected with true in full when metadata is given", () => {
    expect(buildMikroOrmSelect<User>({ name: true, posts: true })).toEqual(["name", "posts"]);
    expect(buildMikroOrmSelect<User>({ name: true, posts: true }, metadata)).toEqual(["name", "posts.*"]);
    expect(buildMikroOrmSelect<User>({ posts: { select: { comments: true, title: true } } }, metadata)).toEqual(["posts.comments.*", "posts.title"]);
  });

  it("scopes relation filters and ordering to the populated relations", () => {
    expect(
      buildMikroOrmPopulateFilters<User>({
        posts: { order: { title: "desc" }, select: { comments: { order: { body: "asc" } } }, where: { title: { Contains: "x" } } },
      }),
    ).toEqual({
      populateOrderBy: { posts: { comments: { body: "asc" }, title: "desc" } },
      populateWhere: { posts: { title: { $ilike: "%x%" } } },
    });
    expect(buildMikroOrmPopulateFilters<User>({ id: true, posts: true })).toEqual({});
  });

  it("rejects relation-scoped clauses MikroORM cannot represent", () => {
    expect(() => buildMikroOrmPopulateFilters<User>({ posts: { limit: 2 } })).toThrow('pagination scoped to relation "posts"');
    expect(() => buildMikroOrmPopulateFilters<User>({ posts: { select: { comments: { where: { body: { Is: "x" } } } } } })).toThrow('"posts.comments"');
  });

  it("maps every top-level clause", () => {
    expect(buildMikroOrmFilters<User>({ limit: 10, offset: 20, order: { age: "desc" }, select: { id: true }, where: { status: { Is: "active" } } })).toEqual({
      options: { fields: ["id"], limit: 10, offset: 20, orderBy: { age: "desc" } },
      where: { status: { $eq: "active" } },
    });
    expect(buildMikroOrmFilters<User>({})).toEqual({ options: {}, where: {} });
  });
});

describe("MikroORM entity types", () => {
  type Entity = { id: number; avatar: Buffer; tags: string[]; posts: Collection<Post> };

  it("resolves collections to the related entity, and keeps strings and buffers whole", () => {
    expectTypeOf<Unwrap<Collection<Post>>>().toEqualTypeOf<Post>();
    expectTypeOf<Unwrap<string | null>>().toEqualTypeOf<string>();
    expectTypeOf<Unwrap<Buffer>>().toEqualTypeOf<Buffer>();
    expectTypeOf<ScalarKeys<Entity>>().toEqualTypeOf<"id" | "tags">();
    expectTypeOf<Select<Entity>["posts"]>().toEqualTypeOf<boolean | QueryFilters<Post> | undefined>();
  });
});
