import { database } from "./db/connection.js";
import { seedTestData } from "./seed/testData.js";

const result = seedTestData(database.db);

console.info(
  `Seeded Google test user ${result.userId}: ${result.categoriesCreated} categories, ${result.expensesCreated} expenses.`
);

database.sqlite.close();
