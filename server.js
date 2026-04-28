import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {

 res.json({
  message: "API is running"
 });

});

const PORT =
 process.env.PORT || 5000;

app.listen(PORT, () => {

 console.log(
  `Server running on port ${PORT}`
 );

});