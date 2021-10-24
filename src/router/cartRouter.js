const cartRoute = require("../core/routerConfig");
const cartController = require("../controller/cartController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

cartRoute
  .route("/carts")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    cartController.getAllClientCartItems
  );

cartRoute
  .route("/carts/:id")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    cartController.deleteItemFromCart
  );

// checkout
cartRoute
  .route("/carts/checkout")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    cartController.checkOut
  );

module.exports = cartRoute;
