// src/app.ts
import express, { Application } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import dotenv from "dotenv";

dotenv.config();

export const createServerExpress = (): Application => {
  const app: Application = express();

  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  return app;
};