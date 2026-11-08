const categoryCount = document.getElementById("categoryCount");
const recipeCount = document.getElementById("recipeCount");

async function loadCategoryCount() {
  try {
    const response = await fetch("/api/categories");

    if (!response.ok) {
      throw new Error("Failed to load categories.");
    }

    const categories = await response.json();

    categoryCount.textContent = categories.length;
  } catch (error) {
    console.error("Category Error:", error);
    categoryCount.textContent = "—";
  }
}

async function loadRecipeCount() {
  try {
    const response = await fetch("/api/recipes");

    if (!response.ok) {
      throw new Error("Failed to load recipes.");
    }

    const recipes = await response.json();

    recipeCount.textContent = recipes.length;
  } catch (error) {
    console.error("Recipe Error:", error);
    recipeCount.textContent = "—";
  }
}

loadCategoryCount();
loadRecipeCount();
