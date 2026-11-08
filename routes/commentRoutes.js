const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Comment = require("../models/comment");
const Recipe = require("../models/recipe");

router.get("/recipe/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: "Invalid recipe ID." });
    }

    const comments = await Comment.find({ recipe: recipeId }).sort({
      createdAt: -1,
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/recipe/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { name, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: "Invalid recipe ID." });
    }

    if (!name || !text || !name.trim() || !text.trim()) {
      return res.status(400).json({
        message: "Name and comment are required.",
      });
    }

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const newComment = await Comment.create({
      recipe: recipeId,
      name,
      text,
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID." });
    }

    const comment = await Comment.findByIdAndDelete(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    res.json({ message: "Comment deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
