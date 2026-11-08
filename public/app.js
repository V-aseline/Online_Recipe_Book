const categoriesContainer = document.getElementById("categoriesContainer");
const recipesContainer = document.getElementById("recipesContainer");
const categorySelect = document.getElementById("recipeCategory");
const addRecipeForm = document.getElementById("addRecipeForm");
const recipeMessage = document.getElementById("recipeMessage");

async function loadCategories() {
  try {
    const response = await fetch("/api/categories");

    if (!response.ok) {
      throw new Error("Failed to load categories.");
    }

    const categories = await response.json();

    categoriesContainer.innerHTML = "";
    categorySelect.innerHTML = '<option value="">Select a Category</option>';

    categories.forEach((category) => {
      const categoryCard = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = category.name;

      const description = document.createElement("p");
      description.textContent =
        category.description || "Explore this category.";

      const count = document.createElement("p");
      count.textContent = `Recipes: ${category.recipeCount ?? 0}`;

      categoryCard.append(title, description, count);
      categoriesContainer.appendChild(categoryCard);

      const option = document.createElement("option");
      option.value = category._id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });

    if (categories.length === 0) {
      categoriesContainer.textContent = "No categories available yet.";
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    categoriesContainer.textContent = "Unable to load categories.";
  }
}

async function loadRecipes(searchTerm = "") {
  try {
    const url = searchTerm
      ? `/api/recipes?search=${encodeURIComponent(searchTerm)}`
      : "/api/recipes";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to load recipes.");
    }

    const recipes = await response.json();

    recipesContainer.innerHTML = "";

    if (recipes.length === 0) {
      recipesContainer.textContent = "No recipes found.";
      return;
    }

    recipes.forEach((recipe) => {
      const recipeCard = document.createElement("div");
      recipeCard.classList.add("recipe-card");

      const title = document.createElement("h3");
      title.textContent = recipe.title;

      const description = document.createElement("p");
      description.textContent = recipe.description;

      const category = document.createElement("p");
      category.textContent = `Category: ${recipe.category?.name || "Uncategorized"}`;

      const viewButton = document.createElement("button");
      viewButton.textContent = "View Recipe";
      viewButton.addEventListener("click", () => {
        showRecipeDetails(recipe._id);
      });

      const editButton = document.createElement("button");
      editButton.textContent = "Edit Recipe";
      editButton.addEventListener("click", () => {
        editRecipe(recipe._id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete Recipe";
      deleteButton.addEventListener("click", () => {
        deleteRecipe(recipe._id);
      });

      recipeCard.append(
        title,
        description,
        category,
        viewButton,
        editButton,
        deleteButton,
      );

      recipesContainer.appendChild(recipeCard);
    });
  } catch (error) {
    console.error("Error loading recipes:", error);
    recipesContainer.textContent = "Unable to load recipes.";
  }
}

async function showRecipeDetails(recipeId) {
  try {
    const response = await fetch(`/api/recipes/${recipeId}`);

    if (!response.ok) {
      throw new Error("Unable to load recipe details.");
    }

    const recipe = await response.json();

    const detailsSection = document.getElementById("recipeDetails");
    const detailsContainer = document.getElementById("recipeDetailsContainer");

    detailsContainer.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = recipe.title;

    const description = document.createElement("p");
    description.textContent = recipe.description;

    const category = document.createElement("p");
    category.textContent = `Category: ${recipe.category?.name || "Uncategorized"}`;

    const ingredientsTitle = document.createElement("h3");
    ingredientsTitle.textContent = "Ingredients";

    const ingredientsList = document.createElement("ul");

    recipe.ingredients.forEach((ingredient) => {
      const item = document.createElement("li");
      item.textContent = ingredient;
      ingredientsList.appendChild(item);
    });

    const instructionsTitle = document.createElement("h3");
    instructionsTitle.textContent = "Cooking Instructions";

    const instructions = document.createElement("p");
    instructions.textContent = recipe.instructions;

    const commentsTitle = document.createElement("h3");
    commentsTitle.textContent = "Comments";

    const commentForm = document.createElement("form");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Your name";
    nameInput.required = true;

    const commentInput = document.createElement("textarea");
    commentInput.placeholder = "Write your comment...";
    commentInput.required = true;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Post Comment";

    const commentsContainer = document.createElement("div");
    commentsContainer.id = "commentsContainer";

    commentForm.append(nameInput, commentInput, submitButton);

    detailsContainer.append(
      title,
      description,
      category,
      ingredientsTitle,
      ingredientsList,
      instructionsTitle,
      instructions,
      commentsTitle,
      commentForm,
      commentsContainer,
    );

    document.getElementById("recipes").hidden = true;
    detailsSection.hidden = false;

    await loadComments(recipeId);

    commentForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const commentResponse = await fetch(
          `/api/comments/recipe/${recipeId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: nameInput.value.trim(),
              text: commentInput.value.trim(),
            }),
          },
        );

        const result = await commentResponse.json();

        if (!commentResponse.ok) {
          throw new Error(result.message || "Failed to post comment.");
        }

        commentForm.reset();
        await loadComments(recipeId);
      } catch (error) {
        alert(error.message);
      }
    });

    window.scrollTo(0, 0);
  } catch (error) {
    console.error("Error loading recipe details:", error);
    alert("Unable to load recipe details.");
  }
}

async function loadComments(recipeId) {
  const commentsContainer = document.getElementById("commentsContainer");

  try {
    const response = await fetch(`/api/comments/recipe/${recipeId}`);

    if (!response.ok) {
      throw new Error("Failed to load comments.");
    }

    const comments = await response.json();

    commentsContainer.innerHTML = "";

    if (comments.length === 0) {
      commentsContainer.textContent = "No comments yet.";
      return;
    }

    comments.forEach((comment) => {
      const commentCard = document.createElement("div");

      const name = document.createElement("h4");
      name.textContent = comment.name;

      const text = document.createElement("p");
      text.textContent = comment.text;

      commentCard.append(name, text);
      commentsContainer.appendChild(commentCard);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
    commentsContainer.textContent = "Unable to load comments.";
  }
}

async function editRecipe(recipeId) {
  try {
    const response = await fetch(`/api/recipes/${recipeId}`);

    if (!response.ok) {
      throw new Error("Unable to load recipe.");
    }

    const recipe = await response.json();

    document.getElementById("recipeTitle").value = recipe.title;
    document.getElementById("recipeDescription").value = recipe.description;
    categorySelect.value = recipe.category?._id || recipe.category;
    document.getElementById("recipeIngredients").value =
      recipe.ingredients.join("\n");
    document.getElementById("recipeInstructions").value = recipe.instructions;
    document.getElementById("recipePrepTime").value = recipe.prepTime || "";
    document.getElementById("recipeCookTime").value = recipe.cookTime || "";
    document.getElementById("recipeServings").value = recipe.servings || "";
    document.getElementById("recipeImage").value = recipe.imageUrl || "";

    addRecipeForm.dataset.editingId = recipeId;

    const submitButton = addRecipeForm.querySelector('button[type="submit"]');
    submitButton.textContent = "Update Recipe";

    recipeMessage.textContent = "Editing recipe: " + recipe.title;
    recipeMessage.style.color = "#58734c";

    document.getElementById("add-recipe").scrollIntoView({
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Error editing recipe:", error);
    alert(error.message);
  }
}

async function deleteRecipe(recipeId) {
  const confirmed = confirm("Are you sure you want to delete this recipe?");

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete recipe.");
    }

    alert("Recipe deleted successfully!");

    await loadCategories();
    await loadRecipes();
  } catch (error) {
    console.error("Error deleting recipe:", error);
    alert(error.message);
  }
}

addRecipeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const recipeData = {
      title: document.getElementById("recipeTitle").value.trim(),
      description: document.getElementById("recipeDescription").value.trim(),
      category: categorySelect.value,
      ingredients: document
        .getElementById("recipeIngredients")
        .value.split("\n")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient !== ""),
      instructions: document.getElementById("recipeInstructions").value.trim(),
      prepTime: Number(document.getElementById("recipePrepTime").value) || 0,
      cookTime: Number(document.getElementById("recipeCookTime").value) || 0,
      servings: Number(document.getElementById("recipeServings").value) || 1,
      imageUrl: document.getElementById("recipeImage").value.trim(),
    };

    const editingId = addRecipeForm.dataset.editingId;
    const url = editingId ? `/api/recipes/${editingId}` : "/api/recipes";

    const response = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipeData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save recipe.");
    }

    recipeMessage.textContent = editingId
      ? "Recipe updated successfully!"
      : "Recipe added successfully!";

    recipeMessage.style.color = "green";

    addRecipeForm.reset();
    delete addRecipeForm.dataset.editingId;

    const submitButton = addRecipeForm.querySelector('button[type="submit"]');
    submitButton.textContent = "Submit Recipe";

    await loadCategories();
    await loadRecipes();

    window.scrollTo(0, 0);
  } catch (error) {
    console.error("Error saving recipe:", error);
    recipeMessage.textContent = error.message;
    recipeMessage.style.color = "red";
  }
});

document.getElementById("backButton").addEventListener("click", () => {
  document.getElementById("recipeDetails").hidden = true;
  document.getElementById("recipes").hidden = false;

  window.scrollTo(0, 0);
});

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

searchButton.addEventListener("click", () => {
  loadRecipes(searchInput.value.trim());
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadRecipes(searchInput.value.trim());
  }
});

loadCategories();
loadRecipes();
