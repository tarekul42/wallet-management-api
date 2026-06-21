import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import { generalApiRateLimiter } from "./config/rateLimiter.js";
import router from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import passport from "passport";
import { envVars } from "./config/env.js";
import "./config/passport.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
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
app.use(
  session({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: envVars.NODE_ENV === "production" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to the Wallet Management API!" });
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
