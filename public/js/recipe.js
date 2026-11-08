const recipeParams = new URLSearchParams(window.location.search);
const recipeId = recipeParams.get("id");

const recipeStatus = document.getElementById("recipeStatus");
const recipeDetail = document.getElementById("recipeDetail");
const commentsContainer = document.getElementById("commentsContainer");
const commentForm = document.getElementById("commentForm");
const commentMessage = document.getElementById("commentMessage");
const commentSubmit = document.getElementById("commentSubmit");

const editRecipeButton = document.getElementById("editRecipeButton");
const deleteRecipeButton = document.getElementById("deleteRecipeButton");
const deleteRecipeDialog = document.getElementById("deleteRecipeDialog");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const deleteErrorMessage = document.getElementById("deleteErrorMessage");

const validRecipeId = Boolean(recipeId && /^[a-f\d]{24}$/i.test(recipeId));

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function formatMinutes(value) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return "Not specified";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function displayError(message) {
  recipeStatus.hidden = false;
  recipeStatus.replaceChildren();

  const text = document.createElement("p");
  text.textContent = message;

  const link = document.createElement("a");
  link.href = "categories.html";
  link.textContent = "Browse Recipes";

  recipeStatus.append(text, link);
  recipeDetail.hidden = true;
}

function renderIngredients(ingredients) {
  const list = document.getElementById("ingredientsList");
  list.replaceChildren();

  const items = Array.isArray(ingredients) ? ingredients : [];

  setText(
    "ingredientCount",
    `${items.length} ${items.length === 1 ? "ingredient" : "ingredients"} needed`,
  );

  items.forEach((ingredient, index) => {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const text = document.createElement("span");

    checkbox.type = "checkbox";
    checkbox.id = `ingredient-${index}`;
    text.textContent = ingredient;

    label.append(checkbox, text);
    item.appendChild(label);
    list.appendChild(item);
  });
}

function renderInstructions(instructions) {
  const list = document.getElementById("stepsList");
  list.replaceChildren();

  const text = String(instructions || "").trim();

  if (!text) {
    const item = document.createElement("li");
    item.textContent = "No cooking instructions provided.";
    list.appendChild(item);
    return;
  }

  let steps = text
    .split(/\n+/)
    .map((step) => step.trim())
    .filter(Boolean);

  if (steps.length === 1) {
    const numbered = text
      .split(/(?:^|\s)(?=\d+[.)]\s)/)
      .map((step) => step.trim())
      .filter(Boolean);

    if (numbered.length > 1) {
      steps = numbered;
    }
  }

  steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step.replace(/^\d+[.)]\s*/, "");
    list.appendChild(item);
  });
}

function renderRecipe(recipe) {
  const categoryName = recipe.category?.name || "Uncategorized";

  document.title = `${recipe.title} | RecipeNest`;

  setText("breadcrumbRecipe", recipe.title);
  setText("recipeCategoryBadge", categoryName);
  setText("recipeTitle", recipe.title);
  setText("recipeDescription", recipe.description || "");
  setText("recipeAboutText", recipe.description || "");
  setText("recipeServings", recipe.servings ?? "Not specified");
  setText("recipePrepTime", formatMinutes(recipe.prepTime));
  setText("recipeTime", formatMinutes(recipe.cookTime));
  setText("recipeCategoryStat", categoryName);

  const primaryPhoto = document.getElementById("recipePrimaryPhoto");

  primaryPhoto.src = recipe.imageUrl?.trim()
    ? recipe.imageUrl
    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85";

  primaryPhoto.alt = recipe.title;

  primaryPhoto.onerror = () => {
    primaryPhoto.onerror = null;
    primaryPhoto.src = "food1.png";
  };

  renderIngredients(recipe.ingredients);
  renderInstructions(recipe.instructions);

  editRecipeButton.href = `add-recipe.html?edit=${encodeURIComponent(recipe._id)}`;

  recipeStatus.hidden = true;
  recipeDetail.hidden = false;
}

async function loadRecipe() {
  if (!validRecipeId) {
    displayError("No valid recipe was selected.");
    return;
  }

  try {
    const response = await fetch(
      `/api/recipes/${encodeURIComponent(recipeId)}`,
    );

    if (!response.ok) {
      throw new Error("Unable to find this recipe.");
    }

    const recipe = await response.json();

    renderRecipe(recipe);
    await loadComments();
  } catch (error) {
    console.error(error);
    displayError(error.message);
  }
}

function renderComment(comment) {
  const card = document.createElement("div");
  card.className = "comment-item";

  const header = document.createElement("div");
  header.className = "comment-item-header";

  const name = document.createElement("h4");
  name.textContent = comment.name || "Anonymous";

  const date = document.createElement("span");
  date.className = "comment-date";

  if (comment.createdAt) {
    const parsedDate = new Date(comment.createdAt);

    date.textContent = Number.isNaN(parsedDate.getTime())
      ? ""
      : parsedDate.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  }

  const text = document.createElement("p");
  text.textContent = comment.text || "";

  header.append(name, date);
  card.append(header, text);

  return card;
}

async function loadComments() {
  commentsContainer.textContent = "Loading comments...";

  try {
    const response = await fetch(
      `/api/comments/recipe/${encodeURIComponent(recipeId)}`,
    );

    if (!response.ok) {
      throw new Error("Unable to load comments.");
    }

    const comments = await response.json();

    if (!Array.isArray(comments)) {
      throw new Error("Invalid comments response.");
    }

    setText(
      "commentCount",
      `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`,
    );

    commentsContainer.replaceChildren();

    if (comments.length === 0) {
      const message = document.createElement("p");
      message.className = "muted";
      message.textContent =
        "No comments yet. Be the first to share your thoughts.";
      commentsContainer.appendChild(message);
      return;
    }

    comments.forEach((comment) => {
      commentsContainer.appendChild(renderComment(comment));
    });
  } catch (error) {
    console.error(error);
    commentsContainer.textContent = "Unable to load comments.";
  }
}

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("commentName").value.trim();
  const text = document.getElementById("commentText").value.trim();

  if (!name || !text) {
    commentMessage.textContent = "Please complete both fields.";
    return;
  }

  commentSubmit.disabled = true;
  commentSubmit.textContent = "Posting...";
  commentMessage.textContent = "";

  try {
    const response = await fetch(
      `/api/comments/recipe/${encodeURIComponent(recipeId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          text,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to post your comment.");
    }

    commentForm.reset();
    commentMessage.style.color = "#567800";
    commentMessage.textContent = "Your comment was posted successfully!";

    await loadComments();
  } catch (error) {
    console.error(error);
    commentMessage.style.color = "#c0392b";
    commentMessage.textContent = error.message;
  } finally {
    commentSubmit.disabled = false;
    commentSubmit.textContent = "Post Comment →";
  }
});

deleteRecipeButton.addEventListener("click", () => {
  if (!validRecipeId || recipeDetail.hidden) {
    return;
  }

  deleteErrorMessage.textContent = "";
  deleteRecipeDialog.showModal();
});

cancelDeleteButton.addEventListener("click", () => {
  deleteRecipeDialog.close();
});

deleteRecipeDialog.addEventListener("click", (event) => {
  if (event.target === deleteRecipeDialog && !confirmDeleteButton.disabled) {
    deleteRecipeDialog.close();
  }
});

deleteRecipeDialog.addEventListener("cancel", (event) => {
  if (confirmDeleteButton.disabled) {
    event.preventDefault();
  }
});

confirmDeleteButton.addEventListener("click", async () => {
  if (!validRecipeId) {
    deleteErrorMessage.textContent = "Invalid recipe ID.";
    return;
  }

  confirmDeleteButton.disabled = true;
  cancelDeleteButton.disabled = true;
  confirmDeleteButton.textContent = "Deleting...";
  deleteErrorMessage.textContent = "";

  try {
    const response = await fetch(
      `/api/recipes/${encodeURIComponent(recipeId)}`,
      {
        method: "DELETE",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to delete recipe.");
    }

    window.location.href = "categories.html#recipes";
  } catch (error) {
    console.error(error);
    deleteErrorMessage.textContent = error.message;
  } finally {
    confirmDeleteButton.disabled = false;
    cancelDeleteButton.disabled = false;
    confirmDeleteButton.textContent = "Yes, Delete Recipe";
  }
});

loadRecipe();
