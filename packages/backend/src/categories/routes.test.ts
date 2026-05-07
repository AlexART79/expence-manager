import { sql } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createTestDatabase } from "../test/helpers/db.js";

function getSessionCookie(response: request.Response) {
  const cookie = response.headers["set-cookie"]?.[0];
  expect(cookie).toBeDefined();
  return cookie as string;
}

async function signIn(app: ReturnType<typeof createApp>, provider: "google" | "github" = "google") {
  const code = provider === "google" ? "test-google" : "test-github";
  const callback = await request(app).get(`/api/auth/${provider}/callback?code=${code}`);
  return getSessionCookie(callback);
}

describe("category routes", () => {
  beforeEach(() => {
    process.env.AUTH_TEST_MODE = "true";
    process.env.FRONTEND_URL = "http://localhost:5173";
  });

  it("rejects unauthenticated category requests", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const response = await request(app).get("/api/categories");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required"
      }
    });

    database.sqlite.close();
  });

  it("creates, lists, renames, and deletes the signed-in user's categories", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);

    const created = await request(app)
      .post("/api/categories")
      .set("Cookie", sessionCookie)
      .send({ name: "  Groceries  " });
    const listed = await request(app).get("/api/categories").set("Cookie", sessionCookie);
    const renamed = await request(app)
      .patch(`/api/categories/${created.body.category.id}`)
      .set("Cookie", sessionCookie)
      .send({ name: "Food" });
    const deleted = await request(app).delete(`/api/categories/${created.body.category.id}`).set("Cookie", sessionCookie);
    const afterDelete = await request(app).get("/api/categories").set("Cookie", sessionCookie);

    expect(created.status).toBe(201);
    expect(created.body.category).toEqual({
      id: expect.any(Number),
      name: "Groceries",
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number)
    });
    expect(listed.body.categories).toHaveLength(1);
    expect(renamed.status).toBe(200);
    expect(renamed.body.category.name).toBe("Food");
    expect(deleted.status).toBe(204);
    expect(afterDelete.body.categories).toEqual([]);

    database.sqlite.close();
  });

  it("rejects duplicate category names per user after trimming and case normalization", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);

    await request(app).post("/api/categories").set("Cookie", sessionCookie).send({ name: "Utilities" });
    const duplicate = await request(app).post("/api/categories").set("Cookie", sessionCookie).send({ name: " utilities " });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "Category name already exists"
      }
    });

    database.sqlite.close();
  });

  it("allows different users to use the same category name", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const googleSession = await signIn(app, "google");
    const githubSession = await signIn(app, "github");

    const googleCategory = await request(app).post("/api/categories").set("Cookie", googleSession).send({ name: "Travel" });
    const githubCategory = await request(app).post("/api/categories").set("Cookie", githubSession).send({ name: "travel" });

    expect(googleCategory.status).toBe(201);
    expect(githubCategory.status).toBe(201);
    expect(githubCategory.body.category.id).not.toBe(googleCategory.body.category.id);

    database.sqlite.close();
  });

  it("hides cross-user category ids behind not found responses", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const googleSession = await signIn(app, "google");
    const githubSession = await signIn(app, "github");
    const created = await request(app).post("/api/categories").set("Cookie", googleSession).send({ name: "Private" });

    const rename = await request(app)
      .patch(`/api/categories/${created.body.category.id}`)
      .set("Cookie", githubSession)
      .send({ name: "Mine" });
    const remove = await request(app).delete(`/api/categories/${created.body.category.id}`).set("Cookie", githubSession);

    expect(rename.status).toBe(404);
    expect(remove.status).toBe(404);

    database.sqlite.close();
  });

  it("blocks category deletion when transactions reference it", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);
    const created = await request(app).post("/api/categories").set("Cookie", sessionCookie).send({ name: "Rent" });

    database.db.run(sql`
      create table transactions (
        id integer primary key autoincrement,
        category_id integer not null
      )
    `);
    database.db.run(sql`insert into transactions (category_id) values (${created.body.category.id})`);

    const response = await request(app).delete(`/api/categories/${created.body.category.id}`).set("Cookie", sessionCookie);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "Category has transactions and cannot be deleted"
      }
    });

    database.sqlite.close();
  });
});
