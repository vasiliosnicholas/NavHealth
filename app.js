import express from "express";

const app = {};

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

app.server = express();

app.run = () => {
  app.server.use(express.static("public"));

  app.server.listen(PORT, HOST, () => {
    console.log(`NavHealth server running on http://${HOST}:${PORT}`);
  });
};

export default app;
