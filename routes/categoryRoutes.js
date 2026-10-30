const express = require("express");
const router = express.Router();

const Category = require("../models/category");
const Recipe = require("../models/recipe");

router.get("/", async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "recipes",
          localField: "_id",
          foreignField: "category",
          as: "recipes",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          recipeCount: { $size: "$recipes" },
        },
      },
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "Invalid category ID." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const category = await Category.create({
      name,
      description,
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This category already exists.",
      });
    }

    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This category already exists.",
      });
    }

    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const hasRecipes = await Recipe.exists({
      category: category._id,
    });

    if (hasRecipes) {
      return res.status(400).json({
        message: "Cannot delete a category that has recipes.",
      });
    }

    await category.deleteOne();

    res.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid category ID." });
  }
});

module.exports = router;
