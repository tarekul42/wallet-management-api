import express, { Request, Response } from "express";
import cors from "cors";
import router from "./routes";
import passport from "passport";
import "./config/passport";
import notFound from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";

const app = express();

// Middlewares
app.use(passport.initialize());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  }),
);

// Main router
app.use("/api/v1", router);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Wallet management api",
  });
});

// Error handlers
app.use(notFound);
app.use(globalErrorHandler);

export default app;
