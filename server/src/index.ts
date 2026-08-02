import express from "express";
import cors from "cors";
import helmet from "helmet";

import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

import { ENV } from "./config/env.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", routes);

app.use(errorHandler);

app.listen(ENV.PORT, () => {
  console.log("Server is running on port:", ENV.PORT);
});
