import { createDatabase } from "../../db/connection.js";

export function createTestDatabase() {
  return createDatabase(":memory:");
}
