const addRecipeForm = document.getElementById("addRecipeForm");
const categoryInput = document.getElementById("recipeCategoryInput");
const ingredientRows = document.getElementById("ingredientInputRows");
const addIngredientButton = document.getElementById("addIngredientRow");
const imageInput = document.getElementById("recipeImageInput");
const primaryPreview = document.getElementById("primaryPreview");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitRecipeButton");

const urlParams = new URLSearchParams(window.location.search);
const editingId = urlParams.get("edit");

const defaultImage = "food1.png";

function showMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;

  if (message) {
    formMessage.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

function createIngredientRow(value = "") {
  const row = document.createElement("div");
  row.className = "ingredient-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "ingredient-input";
  input.placeholder = "e.g. 1 cup flour";
  input.value = value;
  input.required = true;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-ingredient";
  removeButton.textContent = "×";
  removeButton.title = "Remove ingredient";
  removeButton.setAttribute("aria-label", "Remove ingredient");

  removeButton.addEventListener("click", () => {
    if (ingredientRows.children.length > 1) {
      row.remove();
      updateIngredientLabels();
    } else {
      input.value = "";
      input.focus();
    }
  });

  row.append(input, removeButton);
  return row;
}

function updateIngredientLabels() {
  const inputs = ingredientRows.querySelectorAll(".ingredient-input");

  inputs.forEach((input, index) => {
    input.setAttribute("aria-label", `Ingredient ${index + 1}`);
  });
}

function addIngredient(value = "") {
  ingredientRows.appendChild(createIngredientRow(value));
  updateIngredientLabels();
}

function initializeIngredients() {
  const existingInputs = [
    ...ingredientRows.querySelectorAll(".ingredient-input"),
  ];

  ingredientRows.replaceChildren();

  if (existingInputs.length > 0) {
    existingInputs.forEach((input) => {
      addIngredient(input.value);
    });
  } else {
    addIngredient();
  }
}

async function loadCategories() {
  try {
    const response = await fetch("/api/categories");

    if (!response.ok) {
      throw new Error("Unable to load categories.");
    }

    const categories = await response.json();

    if (!Array.isArray(categories)) {
      throw new Error("Invalid category response.");
    }

    categoryInput.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a Category";

    categoryInput.appendChild(placeholder);

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category._id;
      option.textContent = category.name;

      categoryInput.appendChild(option);
    });

    if (categories.length === 0) {
      placeholder.textContent = "No categories available";
      categoryInput.disabled = true;

      showMessage(
        "No categories are available. A category must be created before submitting a recipe.",
        "error",
      );
    }
  } catch (error) {
    console.error(error);

    categoryInput.replaceChildren();

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Unable to load categories";

    categoryInput.appendChild(option);
    categoryInput.disabled = true;

    showMessage("Unable to load categories. Please try again later.", "error");
  }
}

function updateImagePreview() {
  const url = imageInput.value.trim();

  primaryPreview.src = url || defaultImage;
}

primaryPreview.addEventListener("error", () => {
  if (!primaryPreview.src.endsWith(defaultImage)) {
    primaryPreview.src = defaultImage;
  }
});

imageInput.addEventListener("input", updateImagePreview);

addIngredientButton.addEventListener("click", () => {
  addIngredient();

  const inputs = ingredientRows.querySelectorAll(".ingredient-input");
  inputs[inputs.length - 1].focus();
});

function getIngredients() {
  return [...ingredientRows.querySelectorAll(".ingredient-input")]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function getRecipeData() {
  return {
    title: document.getElementById("recipeTitleInput").value.trim(),
    category: categoryInput.value,
    description: document.getElementById("recipeDescriptionInput").value.trim(),
    imageUrl: imageInput.value.trim(),
    servings: Number(document.getElementById("recipeServingsInput").value) || 1,
    prepTime: Number(document.getElementById("recipePrepInput").value) || 0,
    cookTime: Number(document.getElementById("recipeCookInput").value) || 0,
    ingredients: getIngredients(),
    instructions: document
      .getElementById("recipeInstructionsInput")
      .value.trim(),
  };
}

function validateRecipe(data) {
  if (!data.title) {
    return "Please enter a recipe name.";
  }

  if (!data.category) {
    return "Please select a recipe category.";
  }

  if (!data.description) {
    return "Please enter a recipe description.";
  }

  if (data.ingredients.length === 0) {
    return "Please add at least one ingredient.";
  }

  if (!data.instructions) {
    return "Please enter cooking instructions.";
  }

  if (data.servings < 1 || data.servings > 100) {
    return "Servings must be between 1 and 100.";
  }

  if (data.prepTime < 0 || data.cookTime < 0) {
    return "Cooking and preparation times cannot be negative.";
  }

  return "";
}

async function loadRecipeForEditing() {
  if (!editingId) {
    return;
  }

  if (!/^[a-f\d]{24}$/i.test(editingId)) {
    showMessage("Invalid recipe ID.", "error");
    submitButton.disabled = true;
    return;
  }

  try {
    const response = await fetch(
      `/api/recipes/${encodeURIComponent(editingId)}`,
    );

    if (!response.ok) {
      throw new Error("Unable to load recipe for editing.");
    }

    const recipe = await response.json();

    document.title = `Edit ${recipe.title} | RecipeNest`;

    document.querySelector(".add-heading h1").textContent = "Edit Your Recipe";

    document.getElementById("recipeTitleInput").value = recipe.title || "";
    document.getElementById("recipeDescriptionInput").value =
      recipe.description || "";

    categoryInput.value = recipe.category?._id || recipe.category || "";

    document.getElementById("recipeServingsInput").value =
      recipe.servings ?? "";

    document.getElementById("recipePrepInput").value = recipe.prepTime ?? "";

    document.getElementById("recipeCookInput").value = recipe.cookTime ?? "";

    document.getElementById("recipeInstructionsInput").value =
      recipe.instructions || "";

    imageInput.value = recipe.imageUrl || "";

    updateImagePreview();

    ingredientRows.replaceChildren();

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
      recipe.ingredients.forEach((ingredient) => {
        addIngredient(ingredient);
      });
    } else {
      addIngredient();
    }

    submitButton.innerHTML = 'Update Recipe <span aria-hidden="true">↗</span>';
  } catch (error) {
    console.error(error);
    showMessage(error.message, "error");
    submitButton.disabled = true;
  }
}

addRecipeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!addRecipeForm.reportValidity()) {
    return;
  }

  const recipeData = getRecipeData();
  const validationError = validateRecipe(recipeData);

  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  const url = editingId
    ? `/api/recipes/${encodeURIComponent(editingId)}`
    : "/api/recipes";

  const method = editingId ? "PUT" : "POST";

  submitButton.disabled = true;
  submitButton.textContent = editingId
    ? "Updating Recipe..."
    : "Submitting Recipe...";
  showMessage("");

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipeData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to save recipe.");
    }

    showMessage(
      editingId
        ? "Recipe updated successfully!"
        : "Recipe submitted successfully!",
      "success",
    );

    const savedId = result._id || editingId;

    if (savedId) {
      window.location.href = `recipe.html?id=${encodeURIComponent(savedId)}`;
    } else {
      window.location.href = "categories.html#recipes";
    }
  } catch (error) {
    console.error(error);
    showMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;

    submitButton.innerHTML = editingId
      ? 'Update Recipe <span aria-hidden="true">↗</span>'
      : 'Submit Recipe <span aria-hidden="true">↗</span>';
  }
});

async function initializeAddRecipePage() {
  initializeIngredients();
  await loadCategories();
  await loadRecipeForEditing();
}

initializeAddRecipePage();
