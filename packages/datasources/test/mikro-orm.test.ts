import { type Collection, EntitySchema, MikroORM } from "@mikro-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { MikroOrmDatasource, MikroOrmTransactor } from "../src/index.js";
import { itBehavesLikeADatasource } from "./contract.js";

type Post = {
  id: number;
  title: string;
  author: User;
};

type User = {
  id: number;
  name: string;
  email: string | null;
  age: number;
  status: string;
  posts: Collection<Post>;
};

type Insert = { name: string; email?: string | null; age: number; status?: string };

const UserEntity: EntitySchema<User> = new EntitySchema<User>({
  name: "User",
  properties: {
    age: { type: "integer" },
    email: { nullable: true, type: "string" },
    id: { autoincrement: true, primary: true, type: "integer" },
    name: { fieldName: "display_name", type: "string" },
    posts: { entity: () => PostEntity, kind: "1:m", mappedBy: "author" },
    status: { default: "active", type: "string" },
  },
  tableName: "mikro_users",
});

const PostEntity: EntitySchema<Post> = new EntitySchema<Post>({
  name: "Post",
  properties: {
    author: { deleteRule: "cascade", entity: () => UserEntity, kind: "m:1" },
    id: { autoincrement: true, primary: true, type: "integer" },
    title: { type: "string" },
  },
  tableName: "mikro_posts",
});

let orm: MikroORM;
let datasource: MikroOrmDatasource<User, User, Insert>;

beforeAll(async () => {
  orm = await MikroORM.init({ dbName: "memory://", entities: [UserEntity, PostEntity] });
  await orm.schema.create();
  datasource = new MikroOrmDatasource(orm.em, UserEntity);
});

afterAll(async () => {
  await orm.close();
});

beforeEach(async () => {
  await orm.em.execute("TRUNCATE mikro_users, mikro_posts RESTART IDENTITY CASCADE");
});

const seedPosts = async (author: number, titles: string[]) => {
  await orm.em.insertMany(
    PostEntity,
    titles.map((title) => ({ author, title })),
  );
};

describe("MikroOrmDatasource", () => {
  itBehavesLikeADatasource({
    datasource: () => datasource as never,
    transactor: () => new MikroOrmTransactor(orm.em),
  });

  it("infers the entity type from an EntitySchema", () => {
    const inferred = new MikroOrmDatasource(orm.em, UserEntity);
    expectTypeOf(inferred.list).returns.resolves.toEqualTypeOf<User[]>();
  });

  it("returns plain objects and leaves the identity map untouched", async () => {
    await datasource.store({ age: 30, name: "John" });
    const [user] = await datasource.list();

    expect(Object.getPrototypeOf(user)).toBe(Object.prototype);
    expect(orm.em.getUnitOfWork(false).getIdentityMap().values()).toHaveLength(0);
  });

  it("maps updated columns back to property names", async () => {
    const user = await datasource.store({ age: 30, name: "Before" });

    expect(await datasource.modify({ select: { id: true, name: true }, where: { id: { Is: user.id } } }, { name: "After" })).toEqual([
      { id: user.id, name: "After" },
    ]);
  });

  it("selects relations in full or field by field", async () => {
    const user = await datasource.store({ age: 30, name: "John" });
    await seedPosts(user.id, ["Hello", "World"]);

    const [whole] = await datasource.list({ select: { id: true, posts: true } });
    const [partial] = await datasource.list({ select: { name: true, posts: { select: { title: true } } } });

    expect(whole).toEqual({
      id: user.id,
      posts: [
        { author: user.id, id: 1, title: "Hello" },
        { author: user.id, id: 2, title: "World" },
      ],
    });
    expect(partial).toEqual({
      id: user.id,
      name: "John",
      posts: [
        { id: 1, title: "Hello" },
        { id: 2, title: "World" },
      ],
    });
  });

  it("filters and orders selected relations without filtering the root rows", async () => {
    const john = await datasource.store({ age: 30, name: "John" });
    const jane = await datasource.store({ age: 25, name: "Jane" });
    await seedPosts(john.id, ["Alpha", "Beta", "Gamma"]);
    await seedPosts(jane.id, ["Delta"]);

    const rows = await datasource.list({
      order: { id: "asc" },
      select: { name: true, posts: { order: { title: "desc" }, select: { title: true }, where: { title: { Contains: "A" } } } },
    });

    expect(rows).toEqual([
      {
        id: john.id,
        name: "John",
        posts: [
          { id: 3, title: "Gamma" },
          { id: 2, title: "Beta" },
          { id: 1, title: "Alpha" },
        ],
      },
      { id: jane.id, name: "Jane", posts: [{ id: 4, title: "Delta" }] },
    ]);
    expect(await datasource.list({ select: { posts: { where: { title: { Is: "nothing" } } } } })).toEqual([
      { id: john.id, posts: [] },
      { id: jane.id, posts: [] },
    ]);
  });

  it("rejects relation-scoped pagination rather than changing parent-query semantics", async () => {
    await expect(datasource.list({ select: { posts: { limit: 1 } } })).rejects.toThrow('scoped to relation "posts"');
  });

  it("matches nothing for an empty In list", async () => {
    await datasource.store({ age: 30, name: "John" });

    expect(await datasource.list({ where: { id: { In: [] } } })).toEqual([]);
    expect(await datasource.list({ where: { id: { NotIn: [] } } })).toHaveLength(1);
  });
});
