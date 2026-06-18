import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { generalApiRateLimiter } from "./config/rateLimiter";
import router from "./routes";
import notFound from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import passport from "passport";
import { envVars } from "./config/env";
import "./config/passport";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: envVars.CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(generalApiRateLimiter);
app.use(passport.initialize());

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to the Wallet Management API!" });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
