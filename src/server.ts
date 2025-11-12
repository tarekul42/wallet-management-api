import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./config/env";

let server: Server;

const gracefulShutdown = async (signal: string, error?: Error) => {
  if (error) {
    console.error(
      `\nReceived ${signal}. Server Shutting down due to error: `,
      error,
    );
  } else {
    console.info(`\nReceived ${signal}. Server Shutting down gracefully`);
  }

  setTimeout(() => {
    console.warn("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000).unref();

  try {
    // 1. Stop the server from accepting new connections
    if (server) {
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

    // 2. Close the database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.info("Database connection closed.");
    }
  } catch (shutdownError) {
    console.error("Error during graceful shutdown:", shutdownError);
    process.exit(1);
  }

  process.exit(error ? 1 : 0);
};

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);
    console.info("Connected to MongoDB!");

    server = app.listen(envVars.PORT, () => {
      console.info(`Server is listening to port ${envVars.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    // Ensure DB connection is closed if startup fails
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
  gracefulShutdown("unhandledRejection", reason as Error);
});
process.on("uncaughtException", (error) => {
  gracefulShutdown("uncaughtException", error);
});
