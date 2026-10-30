const express = require("express");
const router = express.Router();

const Recipe = require("../models/recipe");
const Category = require("../models/category");
const Comment = require("../models/comment");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;

    let filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { ingredients: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          message: "Invalid category ID.",
        });
      }

      filter.category = category;
    }

    const recipes = await Recipe.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findById(req.params.id).populate(
      "category",
      "name",
    );

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      instructions,
      category,
      prepTime,
      cookTime,
      servings,
      imageUrl,
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0 ||
      ingredients.some((item) => typeof item !== "string" || !item.trim()) ||
      !instructions?.trim() ||
      !category
    ) {
      return res.status(400).json({
        message: "Please provide all required recipe information.",
      });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({
        message: "Invalid category ID.",
      });
    }

    const existingCategory = await Category.findById(category);

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const recipe = await Recipe.create({
      title,
      description,
      ingredients: ingredients.map((item) => item.trim()),
      instructions,
      category,
      prepTime,
      cookTime,
      servings,
      imageUrl,
    });

    const savedRecipe = await Recipe.findById(recipe._id).populate(
      "category",
      "name",
    );

    res.status(201).json(savedRecipe);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      category,
      prepTime,
      cookTime,
      servings,
      imageUrl,
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0 ||
      ingredients.some((item) => typeof item !== "string" || !item.trim()) ||
      !instructions?.trim() ||
      !category
    ) {
      return res.status(400).json({
        message: "Please provide all required recipe information.",
      });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({
        message: "Invalid category ID.",
      });
    }

    const existingCategory = await Category.findById(category);

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        ingredients: ingredients.map((item) => item.trim()),
        instructions,
        category,
        prepTime,
        cookTime,
        servings,
        imageUrl,
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("category", "name");

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    res.json(recipe);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    await Comment.deleteMany({
      recipe: recipe._id,
    });

    res.json({
      message: "Recipe and its comments deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
