export const clothingCategories = ["Conjunto", "Blusas/Top", "Shorts/Calça"];

export const categoryFilterOptions = [
  { value: "all", label: "Tudo" },
  ...clothingCategories.map((category) => ({
    value: category,
    label: category,
  })),
];

const topCategoryAliases = new Set([
  "top",
  "blusa/top",
  "blusas/top",
  "blusa",
  "blusas",
  "regata",
]);

const bottomCategoryAliases = new Set([
  "parte de baixo",
  "shorts/calca",
  "shorts/calça",
  "short",
  "shorts",
  "calca",
  "calça",
  "legging",
]);

const bundleCategoryAliases = new Set(["conjunto", "combo", "look"]);

function categoryKey(category: string) {
  return category.trim().toLocaleLowerCase("pt-BR");
}

export function catalogCategory(category: string) {
  const key = categoryKey(category);
  if (bundleCategoryAliases.has(key)) return "Conjunto";
  if (topCategoryAliases.has(key)) return "Blusas/Top";
  if (bottomCategoryAliases.has(key)) return "Shorts/Calça";
  return category;
}

export function categoryMatches(productCategory: string, selectedCategory: string) {
  if (selectedCategory === "all") return true;
  return catalogCategory(productCategory) === selectedCategory;
}

export function isTopCategory(category: string) {
  return catalogCategory(category) === "Blusas/Top";
}

export function isBottomCategory(category: string) {
  return catalogCategory(category) === "Shorts/Calça";
}
