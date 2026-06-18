import express from "express";
import { connectDb } from "./db.js";
import { getCategories } from "./routes/categories.js";
import { getInsurances } from "./routes/insurances.js";
import { getLocations } from "./routes/locations.js";

const app = {};

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

app.server = express();

app.run = async () => {
  await connectDb();

  app.server.get("/api/categories", getCategories);
  app.server.get("/api/insurances", getInsurances);
  app.server.get("/api/locations", getLocations);
  app.server.use(express.static("public"));

  app.server.listen(PORT, HOST, () => {
    console.log(`NavHealth server running on http://${HOST}:${PORT}`);
  });
};

export default app;
