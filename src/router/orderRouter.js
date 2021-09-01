const orderRoute = require("../core/routerConfig");
const orderController = require("../controller/orderController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

orderRoute
  .route("/orders")
  .post(
    authenticate,
    permit(Object.keys(USER_TYPE.SERVICE_CLIENT)),
    orderController.create
  )
  .get(orderController.getAllOrders);

orderRoute
  .route("/orders/:id")
  .get(orderController.getOrderById)
  .patch(
    authenticate,
    permit(Object.keys(USER_TYPE.SERVICE_PROVIDER)),
    orderController.cancelOrder
  );

orderRoute.route("/orders/client").get(orderController.getAllClientOrder);

module.exports = orderRoute;
