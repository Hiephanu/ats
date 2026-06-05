// src/app.ts
import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import dotenv from "dotenv";

dotenv.config();

export const createServerExpress = (): Application => {
  const app: Application = express();

  app.use(cors());
  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  return app;
};