import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const phase0Metadata = sqliteTable("phase0_metadata", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull()
});
