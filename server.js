// Core Dependencies
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: {origin: ["http://localhost:3000"] }});
const ServiceClient = require("./src/service/ServiceClient");
const ServiceProvider = require("./src/service/ServiceProvider");
module.exports = {
    io,
    app,
};
// Custom Dependencies
require("./src/db/mongoose").db().then();
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
const disputeRouter = require("./src/router/disputeRouter");
const chatRouter = require("./src/router/chatRouter");

// App Init

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
app.use("/api", disputeRouter);
app.use("/api", chatRouter);

io.sockets.on('connection', async function(socket) {
    socket.on("disconnect", async function() {
            await new ServiceClient().updateClientIsOnline('', false, socket.id);
            await new ServiceProvider().updateProviderIsOnline('', false, socket.id);
    });
    socket.on("chat", async function(data) {
        socket.join(data.roomId);
        io.to(data.roomId).emit('chat', data);
    });
    socket.on('typing', function(data){
        socket.broadcast.to(data.roomId).emit('typing', data);
    });
    socket.on("online", async function(data) {
        const { email, userType } = data;
        if (userType === "SERVICE_CLIENT") {
            await new ServiceClient().updateClientIsOnline(email, true, socket.id);
        }
        if (userType === "SERVICE_PROVIDER") {
            await new ServiceProvider().updateProviderIsOnline(email, true, socket.id);
        }
    }
    );
});

http.listen(PORT, () => logger.info(`Ventmode Backend Service Started on port ${PORT}`));