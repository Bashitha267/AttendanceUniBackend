import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import mongoose from "mongoose";

// import sessionRoutes from "./routes/sessionRoutes.js";
import classRoutes from './routes/classRoutes.js';
import lectureRoutes from "./routes/lectureRoutes.js";
import subjects from "./routes/subject.routes.js";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB;
// Middleware
// --- REPLACE YOUR CURRENT cors MIDDLEWARE WITH THIS ---

// List of allowed origins (your frontend URLs)
const allowedOrigins = [
  'https://attendonew.netlify.app',
  'http://localhost:3000', // Add your local dev URL if it's different
  'http://localhost:5173'  // Example for Vite/React dev server
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the request origin is in our list of allowed origins
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      
      return callback(null, true);
    },
    credentials: true, // This allows cookies to be sent
  })
);

// --- THE REST OF YOUR MIDDLEWARE (fileUpload, cookieParser, etc.) GOES AFTER THIS ---
app.use(
  fileUpload({
    useTempFiles: false,
    
   
    limits: { fileSize: 40 * 1024 * 1024 }, // 10MB limit
    abortOnLimit:false,
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
// app.use("/subjects", sessionRoutes);

// app.use("/sessions", SessionRoutes);
app.use('/subjects',subjects)
app.use('/lecturer',lectureRoutes)
app.use('/class',classRoutes)
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.get('/',(req,res)=>{
  return res.json({message:"working fine"})
})
app.head('/ping',(req,res)=>{
   return res.json({message:"working fine"})
})
