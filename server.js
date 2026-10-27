require("dotenv").config();
const mongoose = require("mongoose");

const express = require("express");
const app = express();

app.use(express.json());

async function ConnectDatabase() {
  const Uri = process.env.MONGODB_URI;

  if (!Uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    await mongoose.connect(Uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 2,
    });

    console.log("MongoDB connected successfully");
  } catch (Error) {
    console.error("MongoDB connection failed:", Error);
    throw Error;
  }
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
  ConnectDatabase();
});
