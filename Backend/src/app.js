const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

/*require all the routes here*/
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://gen-ai-interview-generater.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests explicitly
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());
/*using all the routes here*/
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;
