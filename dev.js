import app from "./app.js";
import liveReload from "livereload";
import connectLiveReload from "connect-livereload";

const liveServer = liveReload.createServer();
liveServer.watch("*/*");
liveServer.server.once("connection", () => {
  setTimeout(() => {
    liveServer.refresh("/");
  }, 100);
});
app.server.use(connectLiveReload());
app.run();
