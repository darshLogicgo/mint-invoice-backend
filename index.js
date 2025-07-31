import express from "express";
import cors from "cors";
import config from "./config/config.js";
import connectDB from "./config/db.config.js";
import morgan from "morgan";
import http from "http";
import errorHandler from "./middleware/error-handler.middleware.js";
import router from "./router.js";

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

// connect database
connectDB();

// middleware
app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ origin: "*" }));
app.use(express.static('public'));

// Users Routes
app.use("/api/v1/auth", router.authRoutes);
app.use("/api/v1/invoice", router.invoiceRoutes);
app.use("/api/v1/contact-us", router.contactUsRoutes);
app.use("/api/v1/subscription", router.subscriptionRoutes);

// Initialize Socket.IO
// initializeSocket(server);

// error handler
app.use(errorHandler);

// start server
server.listen(config.port, () => {
  console.log(`Server is running on port http://localhost:${config.port}`);
});

// uncaught exceptions and unhandled rejections
process.on("uncaughtException", function (err) {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", function (err) {
  console.error("Unhandled Rejection:", err);
});
