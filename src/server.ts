import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./config/env";

let server: Server;

const gracefulShutdown = async (signal: string, error?: Error) => {
  if (error) {
    console.error(`Shutting down due to ${signal}.`, error);
  } else {
    console.info(`${signal} signal received. Server shutting down...`);
  }

  const forceExitTimeout = setTimeout(() => {
    console.warn("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000).unref();

  try {
    if (server && server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          console.info("HTTP server closed.");
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.info("Database connection closed.");
    }
  } catch (shutdownError) {
    console.error("Error during graceful shutdown:", shutdownError);
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
    console.info("Connected to MongoDB!");

    server = app.listen(envVars.PORT, () => {
      console.info(`Server is listening to port ${envVars.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
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
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException", error);
});
