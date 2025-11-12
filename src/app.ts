import express, { Request, Response } from "express";
import cors from "cors";
import router from "./routes";
import notFound from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to the Wallet Management API!" });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
