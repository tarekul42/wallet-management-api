import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Wallet management api",
  });
});

export default app;
