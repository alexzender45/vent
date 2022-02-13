const orderRoute = require("../core/routerConfig");
const orderController = require("../controller/orderController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE, ADMIN_ROLES } = require("../utils/constants");

orderRoute.route("/orders").get(orderController.getAllOrders);

orderRoute
  .route("/orders")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    orderController.create
  );

orderRoute.route("/orders/:id").get(orderController.getOrderById);

orderRoute
  .route("/orders/reject")
  .put(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.rejectOrder
  );

orderRoute
  .route("/orders/cancel")
  .put(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    orderController.cancelOrder
  );

orderRoute
  .route("/orders/accept")
  .put(
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

// get order by reference
orderRoute
  .route("/order/reference/:reference")
  .get(authenticate, orderController.getOrderByReference);

orderRoute
  .route("/order/search/:clientId")
  .get(
    authenticate,
    permit(Object.keys(ADMIN_ROLES)),
    orderController.searchOrdersByClientId
  );

// get order by status
orderRoute
  .route("/order/status/:status")
  .get(authenticate, orderController.getOrdersByStatus);

orderRoute
  .route("/order/start-service")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.startOrderedService
  );

orderRoute
  .route("/order/end-service")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.endOrderedService
  );

// get order by status for client
orderRoute
  .route("/order/status/client/order")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    orderController.getOrdersByStatusForClient
  );

// get order by status for provider
orderRoute
  .route("/order/status/provider/order")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    orderController.getOrdersByStatusForProvider
  );
module.exports = orderRoute;
