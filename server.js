// Core Dependencies
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Custom Dependencies
require("./src/db/mongoose").db().then();
require("./src/core/cronjob").updateAvailableBalance();
require("./src/schedule/cronjob");
const { logger } = require("./src/utils/logger");
const { PORT } = require("./src/core/config");

// Routers
const baseRouter = require("./src/router");
const serviceProviderRouter = require("./src/router/serviceProviderRouter");
const serviceClientRouter = require("./src/router/serviceClientRouter");
const bankRouter = require("./src/router/bankRouter");
const categoryRouter = require("./src/router/categoryRouter");
const servicesRouter = require("./src/router/servicesRouter");
const orderRouter = require("./src/router/orderRouter");
const cartRouter = require("./src/router/cartRouter");
const ratingRouter = require("./src/router/ratingRouter");
const transactionRouter = require("./src/router/transactionRouter");
const notificationRouter = require("./src/router/notificationRouter");
const walletRouter = require("./src/router/walletRouter");

// App Init
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ credentials: true, origin: "*" }));
app.use(morgan("tiny"));

// Router Middleware
app.use("/", baseRouter);
app.use("/api", serviceProviderRouter);
app.use("/api", serviceClientRouter);
app.use("/api", bankRouter);
app.use("/api", categoryRouter);
app.use("/api", servicesRouter);
app.use("/api", orderRouter);
app.use("/api", cartRouter);
app.use("/api", ratingRouter);
app.use("/api", transactionRouter);
app.use("/api", notificationRouter);
app.use("/api", walletRouter);

app.listen(PORT, () => logger.info(`Ventmode Backend Service Started on port ${PORT}`));