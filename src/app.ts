import express, { Request, Response } from "express";
import expressSession from "express-session";
import cors from "cors";
import router from "./routes";
import passport from "passport";
import "./config/passport";
import { envVars } from "./config/env";
import notFound from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Wallet management api",
  });
});

export default app;
