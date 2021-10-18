const walletRoute = require("../core/routerConfig");
const walletController = require("../controller/walletController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

walletRoute
  .route("/wallets")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    walletController.getUserWallet
  );

module.exports = walletRoute;
