import type { Category } from "./categoryClient";

export function sortCategories(left: Category, right: Category) {
  return left.name.localeCompare(right.name);
}
