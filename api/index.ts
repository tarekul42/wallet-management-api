import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import app from "../src/app.js";
import { envVars } from "../src/config/env.js";
import logger from "../src/utils/logger.js";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(envVars.DB_URL, {
      tlsAllowInvalidCertificates: envVars.NODE_ENV === "development",
      tlsAllowInvalidHostnames: envVars.NODE_ENV === "development",
    });
    isConnected = db.connections[0].readyState === 1;
    logger.info("Connected to MongoDB from Vercel!");
  } catch (error) {
    logger.error("Failed to connect to MongoDB in Vercel:", error);
    throw error;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  return app(req as unknown as Request, res as unknown as Response);
}
