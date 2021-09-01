const cartRoute = require("../core/routerConfig");
const cartController = require("../controller/cartController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

cartRoute
  .route("/carts")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE.SERVICE_CLIENT)),
    cartController.getAllClientCartItems
  );

cartRoute
  .route("/cart/:id")
  .delete(
    authenticate,
    permit(Object.keys(USER_TYPE.SERVICE_CLIENT)),
    cartController.deleteItemFromCart
  );

module.exports = cartRoute;
