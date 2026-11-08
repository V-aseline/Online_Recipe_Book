const categoryChips = document.getElementById("categoryChips");
const sidebarCategories = document.getElementById("sidebarCategories");
const recipeGrid = document.getElementById("recipeGrid");
const resultCount = document.getElementById("resultCount");
const pageSearchInput = document.getElementById("pageSearchInput");
const headerSearchInput = document.getElementById("searchInput");
const siteSearchForm = document.getElementById("siteSearchForm");
const clearPageSearch = document.getElementById("clearPageSearch");
const resetFilters = document.getElementById("resetFilters");

let categories = [];
let selectedCategory = "";
let searchTerm = "";
let requestNumber = 0;
let searchTimer;

const params = new URLSearchParams(window.location.search);
selectedCategory = params.get("category") || "";
searchTerm = params.get("q") || params.get("search") || "";

pageSearchInput.value = searchTerm;
headerSearchInput.value = searchTerm;

function updateURL() {
  const url = new URL(window.location.href);

  if (selectedCategory) {
    url.searchParams.set("category", selectedCategory);
  } else {
    url.searchParams.delete("category");
  }

  if (searchTerm) {
    url.searchParams.set("q", searchTerm);
  } else {
    url.searchParams.delete("q");
  }

  url.searchParams.delete("search");
  window.history.replaceState({}, "", url);
}

function createChip(label, value) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "chip";
  button.textContent = label;

  if (selectedCategory === value) {
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
  } else {
    button.setAttribute("aria-pressed", "false");
  }

  button.addEventListener("click", () => {
    selectCategory(value);
  });

  return button;
}

function createRadio(label, value) {
  const wrapper = document.createElement("label");
  wrapper.className = "radio-line";

  const input = document.createElement("input");
  input.type = "radio";
  input.name = "categoryFilter";
  input.value = value;
  input.checked = selectedCategory === value;

  const text = document.createElement("span");
  text.textContent = label;

  input.addEventListener("change", () => {
    selectCategory(value);
  });

  wrapper.append(input, text);

  return wrapper;
}

function renderCategories() {
  categoryChips.replaceChildren();
  sidebarCategories.replaceChildren();

  categoryChips.appendChild(createChip("All Recipes", ""));
  sidebarCategories.appendChild(createRadio("All Categories", ""));

  categories.forEach((category) => {
    const label = category.name;
    const count = category.recipeCount ?? 0;

    categoryChips.appendChild(createChip(label, category._id));

    sidebarCategories.appendChild(
      createRadio(`${label} (${count})`, category._id),
    );
  });
}

async function loadCategories() {
  try {
    const response = await fetch("/api/categories");

    if (!response.ok) {
      throw new Error("Unable to load categories.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid category response.");
    }

    categories = data;

    if (
      selectedCategory &&
      !categories.some((category) => category._id === selectedCategory)
    ) {
      selectedCategory = "";
      updateURL();
    }

    renderCategories();
  } catch (error) {
    console.error(error);

    categoryChips.textContent = "Unable to load categories.";
    sidebarCategories.textContent = "Unable to load categories.";
  }
}

function selectCategory(categoryId) {
  selectedCategory = categoryId;

  renderCategories();
  updateURL();
  loadRecipes();

  document.getElementById("recipes").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function createRecipeCard(recipe) {
  const card = document.createElement("a");
  card.className = "recipe-tile";
  card.href = `recipe.html?id=${encodeURIComponent(recipe._id)}`;

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "recipe-tile-image";

  if (recipe.imageUrl && recipe.imageUrl.trim()) {
    const image = document.createElement("img");
    image.src = recipe.imageUrl;
    image.alt = recipe.title;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      image.remove();
    });

    imageWrapper.appendChild(image);
  }

  const content = document.createElement("div");
  content.className = "recipe-tile-content";

  const category = document.createElement("span");
  category.className = "recipe-tile-category";
  category.textContent = recipe.category?.name || "Uncategorized";

  const title = document.createElement("h3");
  title.textContent = recipe.title;

  const description = document.createElement("p");
  description.textContent =
    recipe.description || "Discover this delicious recipe.";

  const footer = document.createElement("div");
  footer.className = "recipe-tile-footer";

  const time = document.createElement("span");
  const totalTime =
    (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0);
  time.textContent = totalTime > 0 ? `${totalTime} min total` : "Recipe";

  const view = document.createElement("span");
  view.textContent = "View Recipe →";

  footer.append(time, view);
  content.append(category, title, description, footer);
  card.append(imageWrapper, content);

  return card;
}

function showMessage(title, description) {
  recipeGrid.replaceChildren();

  const message = document.createElement("div");
  message.className = "empty-state";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const text = document.createElement("span");
  text.textContent = description;

  message.append(heading, text);
  recipeGrid.appendChild(message);
}

async function loadRecipes() {
  const currentRequest = ++requestNumber;

  resultCount.textContent = "Loading recipes...";
  showMessage(
    "Loading recipes",
    "Please wait while we prepare the collection.",
  );

  try {
    const query = new URLSearchParams();

    if (selectedCategory) {
      query.set("category", selectedCategory);
    }

    if (searchTerm) {
      query.set("search", searchTerm);
    }

    const url = query.toString()
      ? `/api/recipes?${query.toString()}`
      : "/api/recipes";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to load recipes.");
    }

    const recipes = await response.json();

    if (currentRequest !== requestNumber) {
      return;
    }

    if (!Array.isArray(recipes)) {
      throw new Error("Invalid recipe response.");
    }

    resultCount.textContent = `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"} found`;

    recipeGrid.replaceChildren();

    if (recipes.length === 0) {
      showMessage(
        "No recipes found",
        "Try another search or select a different category.",
      );
      return;
    }

    recipes.forEach((recipe) => {
      recipeGrid.appendChild(createRecipeCard(recipe));
    });
  } catch (error) {
    if (currentRequest !== requestNumber) {
      return;
    }

    console.error(error);
    resultCount.textContent = "Unable to load recipes";

    showMessage(
      "Something went wrong",
      "We couldn't load the recipes. Please try again later.",
    );
  }
}

function applySearch(value) {
  searchTerm = value.trim();

  pageSearchInput.value = searchTerm;
  headerSearchInput.value = searchTerm;

  updateURL();
  loadRecipes();
}

siteSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  clearTimeout(searchTimer);
  applySearch(headerSearchInput.value);

  document.getElementById("recipes").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

pageSearchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    applySearch(pageSearchInput.value);
  }, 350);
});

clearPageSearch.addEventListener("click", () => {
  clearTimeout(searchTimer);
  applySearch("");
  pageSearchInput.focus();
});

resetFilters.addEventListener("click", () => {
  clearTimeout(searchTimer);

  selectedCategory = "";
  searchTerm = "";

  pageSearchInput.value = "";
  headerSearchInput.value = "";

  renderCategories();
  updateURL();
  loadRecipes();
});

async function initializeCategoriesPage() {
  await loadCategories();
  await loadRecipes();
}

initializeCategoriesPage();
