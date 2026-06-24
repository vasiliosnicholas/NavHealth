import app from "./app.js";
import liveReload from "livereload";
import connectLiveReload from "connect-livereload";

/**
 * Code for developers to run our express server
 * within a live-reload server that refreshes the browser
 */
const liveServer = liveReload.createServer();
liveServer.watch("*/*");
liveServer.server.once("connection", () => {
  setTimeout(() => {
    liveServer.refresh("/");
  }, 100);
});
app.server.use(connectLiveReload());
await app.run();
