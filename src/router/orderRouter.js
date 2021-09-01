const orderRoute = require("../core/routerConfig");
const orderController = require("../controller/orderController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

orderRoute.route("/orders").get(orderController.getAllOrders);

orderRoute
  .route("/orders/:serviceId")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    orderController.create
  );

orderRoute.route("/orders/:id").get(orderController.getOrderById);

orderRoute
  .route("/orders/:id/reject")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.rejectOrder
  );

orderRoute
  .route("/orders/:id/cancel")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    orderController.cancelOrder
  );

orderRoute
  .route("/orders/:id/accept")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.acceptOrder
  );

orderRoute
  .route("/order/service-client")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    orderController.getOrdersForClient
  );

orderRoute
  .route("/order/service-provider")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.getOrdersForProvider
  );

module.exports = orderRoute;
