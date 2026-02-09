import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import createError from "http-errors";

import matchingRouter from "./apps/match/api/index.js";
import cvRouter from "./api/routes/cv.js";

const app = express();

// middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routes
app.use("/matching", matchingRouter);
app.use("/cv", cvRouter);

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying at http://localhost:${PORT}`);
});

export default app;
