import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import SessionRoutes from "./routes/SessionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB;
// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // your React frontend URL
    credentials: true,               // allow cookies and auth headers
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {})
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));

// Routes
app.use("/users", userRoutes);
app.use("/sessions", SessionRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
