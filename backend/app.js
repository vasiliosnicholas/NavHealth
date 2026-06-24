import express from "express";
import { connectDb } from "./database/db.js";
import { getCategories } from "./routes/categories.js";
import { getInsurances } from "./routes/insurances.js";
import {
  createLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  updateLocation,
} from "./routes/locations.js";
import reviewsRouter from "./routes/ReviewsRouter.js";

const app = {};

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

app.server = express();

app.run = async () => {
  await connectDb();

  app.server.use(express.json());

  app.server.get("/api/categories", getCategories);
  app.server.get("/api/insurances", getInsurances);
  app.server.get("/api/locations", getLocations);
  app.server.get("/api/locations/:id", getLocationById);
  app.server.post("/api/locations", createLocation);
  app.server.put("/api/locations/:id", updateLocation);
  app.server.delete("/api/locations/:id", deleteLocation);
  app.server.use(express.static("public"));
  app.server.use("/api/Reviews/", reviewsRouter);

  if (process.env.NODE_ENV !== "production") {
    app.server.listen(PORT, HOST, () => {
      console.log(`NavHealth server running on http://${HOST}:${PORT}`);
    });
  } else {
    app.server.listen(PORT, () => {
      console.log(`NavHealth server running on ${PORT}`);
    });
  }
};

export default app;
