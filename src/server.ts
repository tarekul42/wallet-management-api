import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./config/env";
import logger from "./utils/logger";

let server: Server;

const gracefulShutdown = async (signal: string, error?: Error) => {
  if (error) {
    logger.error(`Shutting down due to ${signal}.`, error);
  } else {
    logger.info(`${signal} signal received. Server shutting down...`);
  }

  const forceExitTimeout = setTimeout(() => {
    logger.warn("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000).unref();

  try {
    if (server && server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          logger.info("HTTP server closed.");
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info("Database connection closed.");
    }
  } catch (shutdownError) {
    logger.error("Error during graceful shutdown:", shutdownError);
  }

  clearTimeout(forceExitTimeout);
  process.exit(error ? 1 : 0);
};

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL, {
      tlsAllowInvalidCertificates: envVars.NODE_ENV === "development",
      tlsAllowInvalidHostnames: envVars.NODE_ENV === "development",
    });
    logger.info("Connected to MongoDB!");

    server = app.listen(envVars.PORT, () => {
      logger.info(`Server is listening to port ${envVars.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

startServer();

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection", reason instanceof Error ? reason : new Error(String(reason)));
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException", error);
});
