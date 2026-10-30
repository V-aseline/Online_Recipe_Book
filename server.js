require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");

const categoryRoutes = require("./routes/categoryRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/categories", categoryRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/comments", commentRoutes);

app.get("/api", (req, res) => {
  res.json({ message: "Online Recipe Book API is running!" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!");

    app.listen(process.env.PORT || 3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
