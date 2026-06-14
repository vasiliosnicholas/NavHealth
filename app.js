import express from "express";
import { connectDb } from "./db.js";

const app = {};

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

app.server = express();

app.run = async () => {
  await connectDb();

  app.server.use(express.static("public"));

  app.server.listen(PORT, HOST, () => {
    console.log(`NavHealth server running on http://${HOST}:${PORT}`);
  });
};

export default app;
